import { TransactionRequest } from "@ethersproject/providers";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import * as hardhat from "hardhat";
import Sinon, * as sinon from "sinon";
import { ProviderWithAgreement } from "../../src/providers/ProviderWithAgreement";
import { Counter } from "../../typechain-types";
import { deployCounter } from "../helpers";
import { RedstoneCommon } from "@redstone-finance/utils";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const BLOCK_NUMBER_TTL = 50;

const createAgreementProvider = (providers: providers.Provider[]) =>
  new ProviderWithAgreement(providers, { blockNumberTTL: BLOCK_NUMBER_TTL });

describe("ProviderWithAgreement", () => {
  let contract: Counter;
  const signer: Signer = new Wallet(TEST_PRIV_KEY);

  beforeEach(async () => {
    contract = await deployCounter(hardhat.ethers.provider);
  });

  afterEach(() => {});

  describe("with 3 same providers", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(() => {
      providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);
      counter = contract.connect(signer.connect(providerWithAgreement));
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

  describe("elected block number cache", () => {
    it("should omit cache when TTL passed", async () => {
      const providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);

      const first = await providerWithAgreement.getBlockNumber();
      await RedstoneCommon.sleep(BLOCK_NUMBER_TTL + 1);
      await hardhat.ethers.provider.send("evm_mine", []);
      const second = await providerWithAgreement.getBlockNumber();

      expect(first + 1).to.eq(second);
    });
    it("should NOT omit cache when TTL NOT passed", async () => {
      const providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);

      const first = await providerWithAgreement.getBlockNumber();
      await hardhat.ethers.provider.send("evm_mine", []);
      const second = await providerWithAgreement.getBlockNumber();

      expect(first).to.eq(second);
    });
  });

  describe("call cache", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(async () => {
      providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);
      const contract = await deployCounter(hardhat.ethers.provider);
      counter = contract.connect(signer.connect(providerWithAgreement));
    });

    it("should use cache", async () => {
      const callSpy = Sinon.spy(providerWithAgreement, "call");
      const callBehindCacheSpy = Sinon.spy(
        providerWithAgreement,
        "executeCallWithAgreement" as keyof ProviderWithAgreement
      );

      const currentBlockNumber = await providerWithAgreement.getBlockNumber();
      const count = await counter.getCount({ blockTag: currentBlockNumber });
      const tx = await counter.inc();
      await tx.wait();
      const secondCount = await counter.getCount({
        blockTag: currentBlockNumber,
      });

      expect(count).to.eq(secondCount);

      expect(callSpy.getCalls().length).to.eq(2);
      expect(callBehindCacheSpy.getCalls().length).to.eq(1);

      // new block number should result in cache miss
      const newBlockNumber = await hardhat.ethers.provider.getBlockNumber();
      const countAtNewBlock = await counter.getCount({
        blockTag: newBlockNumber,
      });
      expect(Number(count.toString()) + 1).to.eq(countAtNewBlock);
      expect(callSpy.getCalls().length).to.eq(3);
      expect(callBehindCacheSpy.getCalls().length).to.eq(2);
    });

    it("should not use cache, on different call", async () => {
      const callSpy = Sinon.spy(providerWithAgreement, "call");
      const callBehindCacheSpy = Sinon.spy(
        providerWithAgreement,
        "executeCallWithAgreement" as keyof ProviderWithAgreement
      );

      const currentBlockNumber = await providerWithAgreement.getBlockNumber();
      const count = await counter.getCountPlusOne({
        blockTag: currentBlockNumber,
      });
      const secondCount = await counter.getCount({
        blockTag: currentBlockNumber,
      });

      expect(count).to.eq(secondCount.add(1));

      expect(callSpy.getCalls().length).to.eq(2);
      expect(callBehindCacheSpy.getCalls().length).to.eq(2);
    });

    // however it will cache call exceptions which is okey
    it("should not cache errors", async () => {
      providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        new hardhat.ethers.providers.JsonRpcProvider(),
      ]);
      counter = contract.connect(signer.connect(providerWithAgreement));

      const callSpy = Sinon.spy(providerWithAgreement, "call");
      const callBehindCacheSpy = Sinon.spy(
        providerWithAgreement,
        "executeCallWithAgreement" as keyof ProviderWithAgreement
      );

      const currentBlockNumber = await providerWithAgreement.getBlockNumber();

      await expect(
        counter.getCount({
          blockTag: currentBlockNumber,
        })
      ).rejectedWith("Failed to find at least 2 agreeing");
      await expect(
        counter.getCount({
          blockTag: currentBlockNumber,
        })
      ).rejectedWith("Failed to find at least 2 agreeing");

      expect(callSpy.getCalls().length).to.eq(2);
      expect(callBehindCacheSpy.getCalls().length).to.eq(2);
    });
  });

  describe("with 2 same providers and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(() => {
      providerWithAgreement = createAgreementProvider([
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        hardhat.ethers.provider,
        hardhat.ethers.provider,
      ]);
      counter = contract.connect(signer.connect(providerWithAgreement));
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

    it("should use given block", async () => {
      const blockNumber = await providerWithAgreement.getBlockNumber();
      const tx = await counter.inc();
      await tx.wait();
      expect(await counter.getCount({ blockTag: blockNumber })).to.eq(0);
      await RedstoneCommon.sleep(BLOCK_NUMBER_TTL + 1);
      expect(await counter.getCount()).to.eq(1);
    });
  });

  describe("with  1 good provider 1 bad provider and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    const brokenProvider = new providers.StaticJsonRpcProvider(
      "http://blabla.xd"
    );

    // return bad result - should be 0
    sinon
      .stub(brokenProvider, "call")
      .onFirstCall()
      .returns(Promise.resolve(`0x${"0".repeat(31)}9`));

    beforeEach(() => {
      providerWithAgreement = createAgreementProvider([
        brokenProvider,
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        hardhat.ethers.provider,
      ]);
      counter = contract.connect(signer.connect(providerWithAgreement));
    });

    it("should read from contract", async () => {
      await expect(counter.getCount()).rejectedWith(
        `Failed to find at least 2 agreeing providers.`
      );
    });

    it("should write to contract", async () => {
      await counter.inc();
    });

    it("should await tx", async () => {
      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("with  1 good provider and 2 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(() => {
      providerWithAgreement = createAgreementProvider([
        hardhat.ethers.provider,
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
      ]);
      counter = contract.connect(signer.connect(providerWithAgreement));
    });

    it("should read from contract", async () => {
      await expect(counter.getCount()).rejectedWith(
        `Failed to find at least 2 agreeing providers.`
      );
    });

    it("should write to contract", async () => {
      await counter.inc();
    });

    it("should await tx", async () => {
      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("call resolution algorithm", () => {
    it("should should return 2 when results from providers are [1,2,2]", async () => {
      await testCallResolutionAlgo(["1", "2", "2"], "2");
    });

    describe("when 3 providers have to agree", () => {
      it("should should return 2 when results from providers are [2,2,2]", async () => {
        await testCallResolutionAlgo(["2", "2", "2"], "2", 3);
      });

      it("should should return 2 when results from providers are [2,2,1]", async () => {
        await expect(
          testCallResolutionAlgo(["2", "2", "1"], "2", 3)
        ).rejectedWith("Failed to find at least 3 agreeing providers.");
      });
    });

    it("should respect getBlockNumber timeout", async () => {
      const firstProvider = new providers.StaticJsonRpcProvider(
        "http://blabla.xd"
      );

      firstProvider.getBlockNumber = () =>
        new Promise((resolve) => setTimeout(() => resolve(0), 22));

      const providerWithAgreement = new ProviderWithAgreement(
        [firstProvider, hardhat.ethers.provider],
        { getBlockNumberTimeoutMS: 20, minimalProvidersCount: 2 }
      );

      expect(await providerWithAgreement.getBlockNumber()).to.eq(
        await hardhat.ethers.provider.getBlockNumber()
      );
    });

    it("should should return 2 when results from providers are [2,2,1]", async () => {
      await testCallResolutionAlgo(["2", "2", "1"], "2");
    });

    it("should should return 5 when results from providers are [5,3,5,3,2,4,2,2]", async () => {
      await testCallResolutionAlgo(
        ["5", "3", "5", "3", "2", "4", "2", "2"],
        "5"
      );
    });

    it('should should return 2 when results from providers are ["5", "3", "8", "7", "1", "4", "2", "2"]', async () => {
      await testCallResolutionAlgo(
        ["5", "3", "8", "7", "1", "4", "2", "2"],
        "2"
      );
    });

    it("should fail on [1,2]", async () => {
      await expect(testCallResolutionAlgo(["1", "2"], "")).rejectedWith(
        "Failed to find at least 2 agreeing providers."
      );
    });

    it("should fail on [1,2,3,4,5,6,7,8,9]", async () => {
      await expect(
        testCallResolutionAlgo(
          ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
          ""
        )
      ).rejectedWith("Failed to find at least 2 agreeing providers.");
    });
  });

  describe("With cureated list enabled", () => {
    it("should work", async () => {
      const firstProvider = hardhat.ethers.provider;
      const secondProvider = hardhat.ethers.provider;
      const brokenProvider = new providers.StaticJsonRpcProvider("2");

      Sinon.stub(brokenProvider, "getBlockNumber").resolves(
        await hardhat.ethers.provider.getBlockNumber()
      );
      const callSpy = Sinon.stub(brokenProvider, "call").rejects("error");

      const agreementProvider = new ProviderWithAgreement(
        [firstProvider, secondProvider, brokenProvider],
        {
          enableRpcCuratedList: true,
          minimalProvidersCount: 2,
        }
      );

      const result = await agreementProvider.call({
        to: contract.address,
        data: "0x00",
      });
      expect(result).to.eq("0x");
      expect(callSpy.callCount).to.eq(1);

      // put to qurantine after error
      agreementProvider.curatedRpcList?.evaluateRpcScore("2");

      await agreementProvider.call({
        to: contract.address,
        data: "0x01",
      });
      expect(callSpy.callCount).to.eq(1);

      // free broken provider from qurantine and use it again
      agreementProvider.curatedRpcList?.freeOneRpcFromQuarantine();

      await agreementProvider.call({
        to: contract.address,
        data: "0x02",
      });
      expect(callSpy.callCount).to.eq(2);
    });
  });
});

const testCallResolutionAlgo = async (
  providerResponses: string[],
  expected: string,
  requiredNumberOfProvidersToAgree = 2
) => {
  const mockProvider = new providers.StaticJsonRpcProvider("http://blabla.xd");
  const stubCall = sinon.stub(mockProvider, "call");

  const stubBlockNumber = sinon.stub(mockProvider, "getBlockNumber");
  stubBlockNumber.resolves(1);

  const agreementProvider = new ProviderWithAgreement(
    new Array<typeof mockProvider>(providerResponses.length).fill(mockProvider),
    { numberOfProvidersThatHaveToAgree: requiredNumberOfProvidersToAgree }
  );

  for (let i = 0; i < providerResponses.length; i++) {
    stubCall.onCall(i).resolves(providerResponses[i]);
  }

  const result = await agreementProvider.call(
    "" as unknown as TransactionRequest
  );
  expect(result).to.eq(expected);
};
