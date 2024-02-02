/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { ErrorCode } from "@ethersproject/logger";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, BytesLike, Transaction, ethers } from "ethers";
import * as hardhat from "hardhat";
import _ from "lodash";
import Sinon from "sinon";
import { ProviderWithFallback, TransactionDeliveryMan } from "../src";
import { Counter } from "../typechain-types";
import { HardhatProviderMocker, deployCounter } from "./helpers";

chai.use(chaiAsPromised);

const underpricedError = {
  code: ErrorCode.INSUFFICIENT_FUNDS,
  message: "maxFeePerGas",
};
const parseTransaction = (transaction: BytesLike) => {
  const parsedTx = ethers.utils.parseTransaction(transaction);

  for (const [key, value] of Object.entries(parsedTx)) {
    if (BigNumber.isBigNumber(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (parsedTx as any)[key] = value.toString();
    }
  }

  return parsedTx;
};

const pickGasAndNonceFieldsOfTx = (transaction: Transaction) =>
  _.pick(transaction, [
    "nonce",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
    "gasLimit",
  ]);

const parseTxForComparison = (transaction: BytesLike) =>
  pickGasAndNonceFieldsOfTx(parseTransaction(transaction));

describe("TransactionDeliveryMan", () => {
  describe("with single provider", () => {
    let counter!: Counter;
    const providerMocker = new HardhatProviderMocker(hardhat.ethers.provider);

    beforeEach(async () => {
      await hardhat.ethers.provider.send("hardhat_reset", []);
      counter = await deployCounter(providerMocker.provider);
    });

    afterEach(() => {
      providerMocker.reset();
    });

    it("should deliver transaction", async () => {
      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(deliveryMan, counter);
    });

    it("should increase maxGas if transaction failed", async () => {
      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub
        .onSecondCall()
        .callsFake(hardhat.ethers.provider.sendTransaction);
      providerMocker.set({ sendTransaction: sendStub });

      await assertTxWillBeDelivered(deliveryMan, counter);

      expect(parseTxForComparison(sendStub.firstCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2375000000",
        maxPriorityFeePerGas: "1500000000",
        gasLimit: "210000",
      });

      expect(parseTxForComparison(sendStub.secondCall.args[0])).to.deep.equal({
        nonce: 1,
        gasLimit: "210000",
        maxFeePerGas: "2671875000",
        maxPriorityFeePerGas: "1687500000",
      });
    });

    it("should updated gas limit after expectedDeliveryTimePassed", async () => {
      const sendStub = Sinon.stub();
      sendStub.callsFake(hardhat.ethers.provider.sendTransaction);
      const getNonceStub = Sinon.stub();
      getNonceStub
        .onFirstCall()
        .returns(1)
        // simulating passing time by returning stale nonce
        .onSecondCall()
        .returns(1)
        .onThirdCall()
        .returns(2);

      providerMocker.set({
        sendTransaction: sendStub,
        getTransactionCount: getNonceStub,
      });

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(deliveryMan, counter);

      expect(sendStub.getCalls().length).to.eq(2);
    });

    it("should error after max attempts", async () => {
      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 2,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub.onSecondCall().rejects(underpricedError);
      providerMocker.set({ sendTransaction: sendStub });

      await expect(deliveryMan.deliver(counter, "inc", [])).rejectedWith();
    });

    it("should increase gas limit for 2d prices", async () => {
      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        isArbitrum: true,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub
        .onSecondCall()
        .callsFake(hardhat.ethers.provider.sendTransaction);
      providerMocker.set({ sendTransaction: sendStub });

      await assertTxWillBeDelivered(deliveryMan, counter);

      expect(parseTxForComparison(sendStub.firstCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2375000000",
        maxPriorityFeePerGas: "1500000000",
        gasLimit: "210000",
      });

      expect(parseTxForComparison(sendStub.secondCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2671875000",
        maxPriorityFeePerGas: "1687500000",
        gasLimit: "315000",
      });
    });

    it("should work with auction model", async () => {
      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        isAuctionModel: true,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub
        .onSecondCall()
        .callsFake(hardhat.ethers.provider.sendTransaction);
      providerMocker.set({ sendTransaction: sendStub });

      await assertTxWillBeDelivered(deliveryMan, counter);
      expect(
        _.pick(parseTransaction(sendStub.firstCall.args[0]), [
          "nonce",
          "gasLimit",
          "gasPrice",
        ])
      ).to.deep.equal({
        nonce: 1,
        gasLimit: "210000",
        gasPrice: "1767328378",
      });

      expect(
        _.pick(parseTransaction(sendStub.secondCall.args[0]), [
          "nonce",
          "gasLimit",
          "gasPrice",
        ])
      ).to.deep.equal({
        nonce: 1,
        gasLimit: "210000",
        gasPrice: "1988244425",
      });
    });
  });
  describe("with more then one provider", () => {
    let counter!: Counter;
    let connectProvider!: (provider: ethers.providers.Provider) => void;

    beforeEach(async () => {
      await hardhat.ethers.provider.send("hardhat_reset", []);
      counter = await deployCounter(hardhat.ethers.provider);
      connectProvider = (provider: ethers.providers.Provider) => {
        const signerWithNewProvider = counter.signer.connect(provider);
        counter = counter.connect(signerWithNewProvider);
      };
    });

    it("should work if one of providers always fails", async () => {
      const failingProvider = new ethers.providers.JsonRpcProvider(
        "https://1.com"
      );
      const fallbackProvider = new ProviderWithFallback([
        failingProvider,
        hardhat.ethers.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);
    });

    it("should account as submitted if one of providers return old nonce", async () => {
      const getNonceStub = Sinon.stub()
        .onFirstCall()
        .callsFake(hardhat.ethers.provider.getTransactionCount)
        .onSecondCall()
        .returns(0);

      const providerWithOldNonceMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        { getTransactionCount: getNonceStub }
      );
      const fallbackProvider = new ProviderWithFallback([
        hardhat.ethers.provider,
        providerWithOldNonceMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);
    });

    it("provider broadcast same transaction to every provider", async () => {
      const firstProviderSendStub = Sinon.stub().callsFake(
        hardhat.ethers.provider.sendTransaction
      );
      const firstProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          sendTransaction: firstProviderSendStub,
        }
      );
      const secondProviderSendStub = Sinon.stub().callsFake(
        hardhat.ethers.provider.sendTransaction
      );
      const secondProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          sendTransaction: secondProviderSendStub,
        }
      );

      const fallbackProvider = new ProviderWithFallback([
        firstProviderMock.provider,
        secondProviderMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);

      expect(firstProviderSendStub.getCalls().length).to.eq(1);
      expect(secondProviderSendStub.getCalls().length).to.eq(1);
    });

    it("should fail if two providers returns same nonce after send TX", async () => {
      // don't bump nonce after new transaction sent
      const getNonceStub = Sinon.stub().returns(1);

      const firstProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          getTransactionCount: getNonceStub,
        }
      );
      const secondProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          getTransactionCount: getNonceStub,
        }
      );

      const fallbackProvider = new ProviderWithFallback([
        firstProviderMock.provider,
        secondProviderMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 1,
      });

      connectProvider(fallbackProvider);
      await expect(assertTxWillBeDelivered(deliveryMan, counter)).rejectedWith(
        "Failed to deliver transaction after 1 attempts"
      );
    });

    it("should work if only of providers notice nonce update", async () => {
      // don't bump nonce after new transaction sent
      const secondProviderGetNonceStub = Sinon.stub().returns(1);

      const secondProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          getTransactionCount: secondProviderGetNonceStub,
        }
      );

      const fallbackProvider = new ProviderWithFallback([
        hardhat.ethers.provider,
        secondProviderMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 1,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);

      // change order of providers
      const fallbackProviderDiffOrder = new ProviderWithFallback([
        secondProviderMock.provider,
        hardhat.ethers.provider,
      ]);
      connectProvider(fallbackProviderDiffOrder);
      await assertTxWillBeDelivered(deliveryMan, counter, 2);
    });

    it("should work if only one provider succeed to broadcast transaction", async () => {
      // don't bump nonce after new transaction sent
      const secondProviderSendTxStub = Sinon.stub().rejects("error sending tx");

      const secondProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          sendTransaction: secondProviderSendTxStub,
        }
      );

      const fallbackProvider = new ProviderWithFallback([
        hardhat.ethers.provider,
        secondProviderMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 1,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);

      // change order of providers
      const fallbackProviderDiffOrder = new ProviderWithFallback([
        secondProviderMock.provider,
        hardhat.ethers.provider,
      ]);
      connectProvider(fallbackProviderDiffOrder);
      await assertTxWillBeDelivered(deliveryMan, counter, 2);
    });

    it("should work if one of providers use stale nonce for building transaction", async () => {
      const secondProviderGetNonceStub = Sinon.stub().returns(0);

      const secondProviderMock = new HardhatProviderMocker(
        hardhat.ethers.provider,
        {
          getTransactionCount: secondProviderGetNonceStub,
        }
      );

      const fallbackProvider = new ProviderWithFallback([
        hardhat.ethers.provider,
        secondProviderMock.provider,
      ]);

      const deliveryMan = new TransactionDeliveryMan({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 1,
      });

      connectProvider(fallbackProvider);
      await assertTxWillBeDelivered(deliveryMan, counter);

      // change order of providers
      const fallbackProviderDiffOrder = new ProviderWithFallback([
        secondProviderMock.provider,
        hardhat.ethers.provider,
      ]);
      connectProvider(fallbackProviderDiffOrder);
      await assertTxWillBeDelivered(deliveryMan, counter, 2);
    });
  });
});
async function assertTxWillBeDelivered(
  deliveryMan: TransactionDeliveryMan,
  counter: Counter,
  expectedCounterValue = 1
) {
  const tx = await deliveryMan.deliver(counter, "inc", []);
  await tx.wait();
  expect(await counter.getCount()).to.eq(expectedCounterValue);
}
