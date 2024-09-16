/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { ErrorCode } from "@ethersproject/logger";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, BytesLike, Transaction, ethers } from "ethers";
import * as hardhat from "hardhat";
import _ from "lodash";
import Sinon from "sinon";
import { TxDelivery, TxDeliveryOpts, convertToTxDeliveryCall } from "../../src";
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
        {
          maxAttempts: 10,
          multiplier: 1.125,
          gasLimitMultiplier: 1.1,
          ...opts,
        },
        counter.signer,
        counter.provider as ethers.providers.JsonRpcProvider
      );

    it("should deliver transaction", async () => {
      const delivery = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(delivery, counter);
    });

    it("should deliver transaction with deferred callData", async () => {
      let count = 1;

      const delivery = new TxDelivery(
        {
          maxAttempts: 10,
          multiplier: 1.125,
          gasLimitMultiplier: 1.1,
          expectedDeliveryTimeMs: 20,
          gasLimit: 210000,
        },
        counter.signer,
        counter.provider as ethers.providers.JsonRpcProvider,
        () =>
          counter.populateTransaction["incBy"](count++).then(
            (call) => call.data as string
          )
      );

      const call = convertToTxDeliveryCall(
        await counter.populateTransaction["incBy"](count)
      );
      await delivery.deliver(call);

      expect(await counter.getCount()).to.eq(1);
    });

    it("should deliver transaction with deferred callData", async () => {
      const count = 8;

      const delivery = new TxDelivery(
        {
          maxAttempts: 10,
          multiplier: 1.125,
          gasLimitMultiplier: 1.1,
          expectedDeliveryTimeMs: 20,
          gasLimit: 210000,
        },
        counter.signer,
        counter.provider as ethers.providers.JsonRpcProvider,
        () =>
          counter.populateTransaction["incBy"](count + 1).then(
            (call) => call.data as string
          )
      );
      // to enforce sending two transactions
      const getNonceStub = Sinon.stub()
        .onFirstCall()
        .returns(1)
        .onSecondCall()
        .returns(1);

      const sendTransactionStub = Sinon.stub();
      sendTransactionStub.callsFake(hardhat.ethers.provider.sendTransaction);

      providerMocker.set({
        getTransactionCount: getNonceStub,
        sendTransaction: sendTransactionStub,
      });

      const call = convertToTxDeliveryCall(
        await counter.populateTransaction["incBy"](count)
      );

      await delivery.deliver(call);

      // on position 161 is placed count param in transaction
      expect((sendTransactionStub.getCalls()[0].firstArg as string)[161]).to.eq(
        "8"
      );
      expect((sendTransactionStub.getCalls()[1].firstArg as string)[161]).to.eq(
        "9"
      );
    });

    it("should increase maxGas if transaction failed", async () => {
      const delivery = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub
        .onSecondCall()
        .callsFake(hardhat.ethers.provider.sendTransaction);
      providerMocker.set({ sendTransaction: sendStub });

      await assertTxWillBeDelivered(delivery, counter);

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

      const delivery = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
      });

      await assertTxWillBeDelivered(delivery, counter);

      expect(sendStub.getCalls().length).to.eq(2);
    });

    it("should error after max attempts", async () => {
      const delivery = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 2,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub.onSecondCall().rejects(underpricedError);
      providerMocker.set({ sendTransaction: sendStub });

      const call = convertToTxDeliveryCall(
        await counter.populateTransaction["inc"]()
      );

      await expect(delivery.deliver(call)).rejectedWith();
    });

    it("should increase gas limit for 2d prices", async () => {
      const delivery = createTxDelivery({
        expectedDeliveryTimeMs: 20,
        twoDimensionalFees: true,
      });

      const sendStub = Sinon.stub();
      sendStub.onFirstCall().rejects(underpricedError);
      sendStub
        .onSecondCall()
        .callsFake(hardhat.ethers.provider.sendTransaction);
      providerMocker.set({ sendTransaction: sendStub });

      await assertTxWillBeDelivered(delivery, counter);

      expect(parseTxForComparison(sendStub.firstCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2375000000",
        maxPriorityFeePerGas: "1500000000",
        gasLimit: "49321",
      });

      expect(parseTxForComparison(sendStub.secondCall.args[0])).to.deep.equal({
        nonce: 1,
        maxFeePerGas: "2671875000",
        maxPriorityFeePerGas: "1687500000",
        gasLimit: "54253",
      });
    });

    it("should work with auction model", async () => {
      const delivery = createTxDelivery({
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

      await assertTxWillBeDelivered(delivery, counter);
      expect(
        _.pick(parseTransaction(sendStub.firstCall.args[0]), [
          "nonce",
          "gasLimit",
          "gasPrice",
        ])
      ).to.deep.equal({
        nonce: 1,
        gasLimit: "210000",
        gasPrice: "1768221906",
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
        gasPrice: "1989249644",
      });
    });
  });
});

async function assertTxWillBeDelivered(
  delivery: TxDelivery,
  counter: Counter,
  expectedCounterValue = 1
) {
  const call = convertToTxDeliveryCall(
    await counter.populateTransaction["inc"]()
  );
  await delivery.deliver(call);
  expect(await counter.getCount()).to.eq(expectedCounterValue);
}
