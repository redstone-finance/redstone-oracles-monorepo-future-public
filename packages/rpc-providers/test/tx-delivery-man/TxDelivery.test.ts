/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { ErrorCode } from "@ethersproject/logger";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, BytesLike, Transaction, ethers } from "ethers";
import * as hardhat from "hardhat";
import _ from "lodash";
import Sinon from "sinon";
import { TxDelivery, TxDeliveryOpts, makeTxDeliveryCall } from "../../src";
import { Counter } from "../../typechain-types";
import { HardhatProviderMocker, deployCounter } from "../helpers";

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

describe("TxDelivery", () => {
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

    const createTxDelivery = (opts: TxDeliveryOpts) =>
      new TxDelivery(
        opts,
        counter.signer,
        counter.provider as ethers.providers.JsonRpcProvider
      );

    it("should deliver transaction", async () => {
      const deliveryMan = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(deliveryMan, counter);
    });

    it("should increase maxGas if transaction failed", async () => {
      const deliveryMan = createTxDelivery({
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

      const deliveryMan = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(deliveryMan, counter);

      expect(sendStub.getCalls().length).to.eq(2);
    });

    it("should error after max attempts", async () => {
      const deliveryMan = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 2,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub.onSecondCall().rejects(underpricedError);
      providerMocker.set({ sendTransaction: sendStub });

      const call = makeTxDeliveryCall(
        await counter.populateTransaction["inc"]()
      );

      await expect(deliveryMan.deliver(call)).rejectedWith();
    });

    it("should increase gas limit for 2d prices", async () => {
      const deliveryMan = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        twoDimensionalFees: true,
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
        gasLimit: "49271",
      });

      expect(parseTxForComparison(sendStub.secondCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2671875000",
        maxPriorityFeePerGas: "1687500000",
        gasLimit: "54198",
      });
    });

    it("should work with auction model", async () => {
      const deliveryMan = createTxDelivery({
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
});

async function assertTxWillBeDelivered(
  deliveryMan: TxDelivery,
  counter: Counter,
  expectedCounterValue = 1
) {
  const call = makeTxDeliveryCall(await counter.populateTransaction["inc"]());
  const tx = await deliveryMan.deliver(call);
  await tx.wait();
  expect(await counter.getCount()).to.eq(expectedCounterValue);
}
