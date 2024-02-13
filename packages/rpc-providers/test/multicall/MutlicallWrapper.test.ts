import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Contract, Wallet, ethers } from "ethers";
import * as hardhat from "hardhat";
import Sinon from "sinon";
import {
  ProviderWithAgreement,
  ProviderWithFallback,
  MulticallDecorator,
} from "../../src";
import * as multicallUtils from "../../src/provider-decorators/multicall/Multicall3Caller";
import { Counter } from "../../typechain-types";
import { HardhatProviderMocker, deployCounter } from "../helpers";

chai.use(chaiAsPromised);

const multicallFnSpy = Sinon.spy(multicallUtils.multicall3);
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(multicallUtils as any).multicall3 = multicallFnSpy;

function getProvider(
  multicallAddress: string,
  providerFabric: () => ethers.providers.Provider,
  bufferSize = 2,
  maxCallDataSize = 100000000,
  autoResolveInterval = -1
) {
  return MulticallDecorator(providerFabric, {
    autoResolveInterval: autoResolveInterval,
    maxCallsCount: bufferSize,
    maxCallDataSize: maxCallDataSize,
    multicallAddress,
  })();
}

const NOT_MULTICALL_ADDRESS = Wallet.createRandom().address;

const describeMultiWrapperSuite = (
  providerName: string,
  providerFabric: () => ethers.providers.Provider
) => {
  describe(`${providerName}`, () => {
    let counter!: Counter;
    let multicall!: Contract;

    beforeEach(async () => {
      await hardhat.ethers.provider.send("hardhat_reset", []);
      counter = await deployCounter(hardhat.ethers.provider);
      await counter.inc().then((tx) => tx.wait());
      multicall = await hardhat.ethers.deployContract("Multicall3");
      multicallFnSpy.resetHistory();
    });

    it("should group 2 calls to same contract", async () => {
      const multicallProvider = getProvider(multicall.address, providerFabric);
      counter = counter.connect(multicallProvider);

      const [count, countPlusOne] = await Promise.all([
        counter.getCount(),
        counter.getCountPlusOne(),
      ]);

      expect(count.toNumber() + 1).to.eq(countPlusOne);
    });

    it("should group 2 calls to same contract and one to different contract", async () => {
      const multicallProvider = getProvider(multicall.address, providerFabric);
      counter = counter.connect(multicallProvider);
      const counter2 = (await deployCounter(hardhat.ethers.provider)).connect(
        multicallProvider
      );

      const [count, count2] = await Promise.all([
        counter.getCount(),
        counter2.getCountPlusOne(),
      ]);
      expect(count).to.eq(count2);
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("should make call to one contract", async () => {
      const multicallProvider = getProvider(
        multicall.address,
        providerFabric,
        1
      );
      counter = counter.connect(multicallProvider);

      const [count] = await Promise.all([counter.getCount()]);

      expect(count.toNumber()).to.eq(1);
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("should throw error on fail (error should match with ethers error), with same contract", async () => {
      const [ethersProviderResult] = await Promise.allSettled([
        counter.connect(hardhat.ethers.provider).fail(),
      ]);

      const multicallProvider = getProvider(multicall.address, providerFabric);
      counter = counter.connect(multicallProvider);

      const [resultCounter, resultCounter2] = await Promise.allSettled([
        counter.getCount(),
        counter.fail(),
      ]);

      const resolvedResultCounter =
        resultCounter as PromiseFulfilledResult<BigNumber>;

      expect(resolvedResultCounter.value.toNumber()).to.eq(1);
      expect(resolvedResultCounter.status).to.eq("fulfilled");

      expect(resultCounter2).to.deep.eq(ethersProviderResult);
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("should throw error on fail (error should match with ethers error), with two contracts", async () => {
      const [ethersProviderResult] = await Promise.allSettled([
        counter.connect(hardhat.ethers.provider).fail(),
      ]);

      const multicallProvider = getProvider(multicall.address, providerFabric);
      counter = counter.connect(multicallProvider);

      const counter2 = (await deployCounter(hardhat.ethers.provider)).connect(
        multicallProvider
      );

      const [resultCounter, resultCounter2] = await Promise.allSettled([
        counter2.getCount(),
        counter.fail(),
      ]);

      const resolvedResultCounter =
        resultCounter as PromiseFulfilledResult<BigNumber>;

      expect(resolvedResultCounter.value).to.eq(0);
      expect(resolvedResultCounter.status).to.eq("fulfilled");

      expect(resultCounter2).to.deep.eq(ethersProviderResult);
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("should reject on all contracts on network error", async () => {
      // we provide wrong multicall address to simulate rpc error
      const multicallProvider = getProvider(
        NOT_MULTICALL_ADDRESS,
        () => {
          const provider = providerFabric();
          provider.call = () => Promise.reject(new Error("error"));
          return provider;
        },
        2
      );
      counter = counter.connect(multicallProvider);

      const [resultCounter, resultCounter2] = await Promise.allSettled([
        counter.getCount(),
        counter.getCount(),
      ]);

      expect(resultCounter.status).to.eq("rejected");
      expect(resultCounter2.status).to.eq("rejected");
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("should group by blockTag", async () => {
      // we provide wrong multicall address to simulate rpc error
      const multicallProvider = getProvider(
        multicall.address,
        providerFabric,
        1
      );
      counter = counter.connect(multicallProvider);

      const blockNumber = await multicallProvider.getBlockNumber();

      const [resultCounter, resultCounter2] = await Promise.all([
        counter.getCount({ blockTag: blockNumber }),
        counter.getCount(),
      ]);

      expect(resultCounter).to.eq(1);
      expect(resultCounter2).to.eq(1);

      expect(multicallFnSpy.getCalls().length).to.eq(2);
    });

    it("it should fallback to provider.call when multicall fails", async () => {
      const multicallProvider = getProvider(
        NOT_MULTICALL_ADDRESS,
        providerFabric,
        2
      );

      counter = counter.connect(multicallProvider);

      const [count, count2] = await Promise.all([
        counter.getCount(),
        counter.getCount(),
      ]);
      expect(count).to.eq(count2);
      expect(multicallFnSpy.getCalls().length).to.eq(1);
    });

    it("it should empty execute queue base on callDataSize", async () => {
      const multicallProvider = getProvider(
        multicall.address,
        providerFabric,
        3,
        37 + 1, // should fit one requests
        10
      );

      counter = counter.connect(multicallProvider);

      const [count, count2] = await Promise.all([
        counter.getCountWithCallData32Bytes(1),
        counter.getCountWithCallData32Bytes(1),
      ]);

      expect(count).to.eq(count2);
      expect(multicallFnSpy.getCalls().length).to.eq(2);
    });

    it("it should work when fallback fails partially", async () => {
      type ProviderCall = typeof ethers.providers.Provider.prototype.call;
      type Params = Parameters<ProviderCall>;
      type Ret = ReturnType<ProviderCall>;
      type ProviderCallStub = Sinon.SinonStub<Params, Ret>;
      let stub: ProviderCallStub;

      const customProviderFabric = () => {
        const provider = providerFabric();

        stub = Sinon.stub<Params, Ret>()
          .onFirstCall()
          .rejects(new Error("multi call error"))
          .onSecondCall()
          .rejects(new Error("first fallback call error"))
          .onThirdCall()
          .callsFake(provider.call.bind(provider));

        provider.call = stub;

        return provider;
      };

      const multicallProvider = getProvider(
        NOT_MULTICALL_ADDRESS,
        customProviderFabric,
        2
      );

      counter = counter.connect(multicallProvider);

      const [count, count2] = await Promise.allSettled([
        counter.getCount(),
        counter.getCount(),
      ]);

      expect(stub!.getCalls().length).eq(3);
      const countCasted = count as PromiseRejectedResult;
      const count2Casted = count2 as PromiseFulfilledResult<BigNumber>;

      expect(countCasted.status).eq("rejected");
      expect((countCasted.reason as Error).message).eq(
        "first fallback call error"
      );
      expect(count2Casted.status).eq("fulfilled");
      expect(count2Casted.value.toString()).eq("1");
    });
  });
};

describe("Multicall decorator", () => {
  describeMultiWrapperSuite(
    "HardhatEthersProvider",
    () => new HardhatProviderMocker(hardhat.ethers.provider).provider
  );

  describeMultiWrapperSuite(
    "ProviderWithAgreement",
    () =>
      new ProviderWithAgreement([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
        new ethers.providers.JsonRpcProvider(), // this one will always fail
      ])
  );

  describeMultiWrapperSuite(
    "ProviderWithFallback",
    () =>
      new ProviderWithFallback([
        new ethers.providers.JsonRpcProvider(), // this one will always fail
        hardhat.ethers.provider,
      ])
  );
});
