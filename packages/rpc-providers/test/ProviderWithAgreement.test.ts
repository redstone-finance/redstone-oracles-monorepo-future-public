import * as hardhat from "hardhat";
import chai, { expect } from "chai";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import { Counter } from "../typechain-types";
import { ProviderWithAgreement } from "../src/ProviderWithAgreement";
import { deployCounter } from "./helpers";

chai.use(chaiAsPromised);

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
describe("ProviderWithAgreement", () => {
  let contract: Counter;
  let signer: Signer = new Wallet(TEST_PRIV_KEY);

  beforeEach(async () => {
    contract = await deployCounter();
  });

  afterEach(() => {});

  describe("with 3 same providers", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
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
      const providerWithAgreement = new ProviderWithAgreement(
        [hardhat.ethers.provider, hardhat.ethers.provider],
        { blockNumberCacheTTLInMS: 0 }
      );

      const first = await providerWithAgreement.getBlockNumber();
      await hardhat.ethers.provider.send("evm_mine", []);
      const second = await providerWithAgreement.getBlockNumber();

      expect(first + 1).to.eq(second);
    });
    it("should NOT omit cache when TTL NOT passed", async () => {
      const providerWithAgreement = new ProviderWithAgreement(
        [hardhat.ethers.provider, hardhat.ethers.provider],
        { blockNumberCacheTTLInMS: 5000 }
      );

      const first = await providerWithAgreement.getBlockNumber();
      await hardhat.ethers.provider.send("evm_mine", []);
      const second = await providerWithAgreement.getBlockNumber();

      expect(first).to.eq(second);
    });
  });

  describe("with 2 same providers and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement(
        [
          new providers.StaticJsonRpcProvider("http://blabla.xd"),
          hardhat.ethers.provider,
          hardhat.ethers.provider,
        ],
        { blockNumberCacheTTLInMS: 0 }
      );
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
      expect(await counter.getCount()).to.eq(1);
    });
  });

  describe("with  1 good provider 1 bad provider and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    const falseProvider = new providers.StaticJsonRpcProvider(
      "http://blabla.xd"
    );

    // return bad result - should be 0
    sinon
      .stub(falseProvider, "call")
      .onFirstCall()
      .returns(Promise.resolve(`0x${"0".repeat(31)}9`));

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
        falseProvider,
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

    beforeEach(async () => {
      providerWithAgreement = new ProviderWithAgreement([
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
        { getBlockNumberTimeoutMS: 20 }
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
    new Array(providerResponses.length).fill(mockProvider),
    { numberOfProvidersThatHaveToAgree: requiredNumberOfProvidersToAgree }
  );

  for (let i = 0; i < providerResponses.length; i++) {
    stubCall.onCall(i).resolves(providerResponses[i]);
  }

  const result = await agreementProvider.call("" as any);
  expect(result).to.eq(expected);
};
