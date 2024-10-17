/* eslint-disable @typescript-eslint/unbound-method */
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "ethers";
import * as hardhat from "hardhat";
import Sinon from "sinon";
import { ProviderWithFallback, convertToTxDeliveryCall } from "../../src";
import { TxDeliveryMan } from "../../src/tx-delivery-man/TxDeliveryMan";
import { Counter } from "../../typechain-types";
import { HardhatProviderMocker, deployCounter } from "../helpers";

chai.use(chaiAsPromised);

async function assertTxWillBeDelivered(
  deliveryMan: TxDeliveryMan,
  counter: Counter,
  expectedCounterValue = 1
) {
  const call = convertToTxDeliveryCall(
    await counter.populateTransaction["inc"]()
  );
  await deliveryMan.deliver(call);
  expect(await counter.getCount()).to.eq(expectedCounterValue);
}

describe("TxDeliveryMan", () => {
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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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
      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 1,
      });

      connectProvider(fallbackProvider);

      await expect(assertTxWillBeDelivered(deliveryMan, counter)).rejectedWith(
        "All promises were rejected"
      );
    });

    it("should work if only of providers notice nonce update", async () => {
      // don't bump nonce after new transaction sent
      const secondProviderGetNonceStub = Sinon.stub()
        .onFirstCall()
        .resolves(0)
        .onSecondCall()
        .resolves(1);

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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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

      const deliveryMan = new TxDeliveryMan(fallbackProvider, counter.signer, {
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

    it("should cancel current delivery start new one", async () => {
      const deliveryMan = new TxDeliveryMan(
        hardhat.ethers.provider,
        counter.signer,
        {
          expectedDeliveryTimeMs: 20,
          gasLimit: 210000,
        }
      );

      connectProvider(hardhat.ethers.provider);

      await Promise.allSettled([
        assertTxWillBeDelivered(deliveryMan, counter),
        assertTxWillBeDelivered(deliveryMan, counter),
      ]);

      await assertTxWillBeDelivered(deliveryMan, counter, 2);
    });

    it("should called deferred callData function if passed", async () => {
      const getNonceStub = Sinon.stub()
        .onFirstCall()
        .resolves(1)
        .onSecondCall()
        .resolves(1)
        .onThirdCall()
        .resolves(2);

      const provider = new HardhatProviderMocker(hardhat.ethers.provider, {
        getTransactionCount: getNonceStub,
        sendTransaction: () => ({ hash: "mock_hash" }),
      }).provider;

      const deliveryMan = new TxDeliveryMan(provider, counter.signer, {
        expectedDeliveryTimeMs: 20,
        gasLimit: 210000,
        maxAttempts: 2,
      });

      connectProvider(provider);

      const deferredSpy = Sinon.stub().callsFake(() =>
        counter.populateTransaction["inc"]().then((tx) => tx.data!)
      );

      try {
        await deliveryMan.deliver(
          await counter.populateTransaction["inc"]().then((req) =>
            convertToTxDeliveryCall(req)
          ),
          deferredSpy
        );
      } catch (e) {
        console.log(e);
      }

      expect(getNonceStub.getCalls().length).to.eq(3);
      expect(deferredSpy.getCalls().length).to.eq(1);
    });
  });
});
