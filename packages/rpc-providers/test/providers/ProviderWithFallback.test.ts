import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import * as hardhat from "hardhat";
import * as sinon from "sinon";
import { ProviderWithFallback } from "../../src/providers/ProviderWithFallback";
import { Counter } from "../../typechain-types";
import { deployCounter } from "../helpers";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("ProviderWithFallback", () => {
  const signer: Signer = new Wallet(TEST_PRIV_KEY);
  let contract: Counter;

  beforeEach(async () => {
    contract = await deployCounter(hardhat.ethers.provider);
  });

  describe("with first always failing and second always working provider", () => {
    let fallbackProvider: ProviderWithFallback;
    let counter: Counter;

    beforeEach(() => {
      const alwaysFailingProvider = new providers.JsonRpcProvider(
        "http://blabla.xd"
      );
      fallbackProvider = new ProviderWithFallback([
        alwaysFailingProvider,
        hardhat.ethers.provider,
      ]);
      counter = contract.connect(signer.connect(fallbackProvider));
    });

    it("should read from contract", async () => {
      expect(await counter.getCount()).to.eq(0);
    });

    it("should write to contract", async () => {
      await counter.inc();
    });

    it("should await tx", async () => {
      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  it("should call second provider if first fails", async () => {
    const [firstStub, secondStub] = getStubProviders(2);

    const fallbackProvider = new ProviderWithFallback([
      firstStub.stubProvider,
      secondStub.stubProvider,
    ]);
    firstStub.spy.onFirstCall().rejects();
    secondStub.spy.onFirstCall().resolves(10);

    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(0);
    expect(await fallbackProvider.getBlockNumber()).to.eq(10);
    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(1);
  });

  it("should call first provider if second is active but fails", async () => {
    const [firstStub, secondStub] = getStubProviders(2);

    const fallbackProvider = new ProviderWithFallback([
      firstStub.stubProvider,
      secondStub.stubProvider,
    ]);

    firstStub.spy.onFirstCall().rejects().onSecondCall().resolves(10);
    secondStub.spy.onFirstCall().resolves(10).onSecondCall().rejects();

    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(0);
    expect(await fallbackProvider.getBlockNumber()).to.eq(10);
    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(1);

    expect(await fallbackProvider.getBlockNumber()).to.eq(10);
    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(0);
  });

  it("should propagate if both fails", async () => {
    const [firstStub, secondStub] = getStubProviders(2);

    const fallbackProvider = new ProviderWithFallback([
      firstStub.stubProvider,
      secondStub.stubProvider,
    ]);

    firstStub.spy.onFirstCall().rejects();
    secondStub.spy.onFirstCall().rejects();

    await expect(fallbackProvider.getBlockNumber()).rejected;
    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(1);
  });

  it("should react on events event if current provider is second one (and first doesn't work)", async () => {
    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );
    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();

    const tx = await contract.connect(signer.connect(fallbackProvider)).inc();
    await fallbackProvider.waitForTransaction(tx.hash);

    await new Promise((r) => setTimeout(r, 100));
    expect(onBlockSpy.callCount).to.eq(1);
  });

  it("removing listener after swapping providers", async () => {
    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );
    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();
    fallbackProvider.off("block");

    const tx = await contract.connect(signer.connect(fallbackProvider)).inc();
    await fallbackProvider.waitForTransaction(tx.hash);

    await new Promise((r) => setTimeout(r, 100));
    expect(onBlockSpy.callCount).to.eq(0);
  });

  it("event is triggered only once per all fallback providers", async () => {
    const alwaysFailingProvider = new providers.JsonRpcProvider(
      "http://blabla.xd"
    );

    const fallbackProvider = new ProviderWithFallback([
      alwaysFailingProvider,
      hardhat.ethers.provider,
    ]);

    const onBlockSpy = sinon.spy();
    fallbackProvider.on("block", onBlockSpy);
    // first provider fails so fallback switch to another
    await fallbackProvider.getBlockNumber();

    expect(alwaysFailingProvider.listenerCount()).to.eq(0);
    expect(fallbackProvider.listenerCount()).to.eq(1);
    expect(hardhat.ethers.provider.listenerCount()).to.eq(1);
  });

  it("should throw on revert", async () => {
    await expect(contract.fail()).rejectedWith();
  });

  it("should not increase provider index by 2 on 2 concurrent requests (rare case)", async () => {
    const [firstStub, secondStub] = getStubProviders(2);

    const fallbackProvider = new ProviderWithFallback([
      firstStub.stubProvider,
      secondStub.stubProvider,
    ]);

    firstStub.spy.rejects();
    secondStub.spy.rejects();

    await Promise.allSettled([
      fallbackProvider.getBlockNumber(),
      fallbackProvider.getBlockNumber(),
    ]);

    expect(fallbackProvider.getCurrentProviderIndex()).to.eq(1);
  });
});

const getStubProviders = (count: number) => {
  const stubs = [];

  for (let i = 0; i < count; i++) {
    const stubProvider = new providers.StaticJsonRpcProvider();
    const spy = sinon.stub(stubProvider, "getBlockNumber");
    stubs.push({ stubProvider, spy });
  }
  return stubs;
};
