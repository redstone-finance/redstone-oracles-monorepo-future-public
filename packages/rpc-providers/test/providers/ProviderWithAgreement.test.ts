import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { providers, Signer, Wallet } from "ethers";
import * as hardhat from "hardhat";
import Sinon, * as sinon from "sinon";
import { CallCacheDecorator } from "../../src/provider-decorators/CacheCallDecorator";
import { ProviderWithAgreement } from "../../src/providers/ProviderWithAgreement";
import { Counter } from "../../typechain-types";
import { deployCounter } from "../helpers";

chai.use(chaiAsPromised);

// adding method here generates agreement logic tests for it
const operationsWithAgreement = ["call", "getBalance"] as const;

const TEST_PRIV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const createAgreementProvider = (providers: providers.Provider[]) =>
  new ProviderWithAgreement(providers);

describe("ProviderWithAgreement", () => {
  let contract: Counter;
  const signer: Signer = new Wallet(TEST_PRIV_KEY);

  beforeEach(async () => {
    contract = await deployCounter(hardhat.ethers.provider);
  });

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
      expect(
        await counter.getCount({
          blockTag: await providerWithAgreement.getBlockNumber(),
        })
      ).to.eq(0);
    });

    it("should write to contract", async () => {
      await counter.inc();
    });

    it("should await tx", async () => {
      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
    });
  });

  describe("CallCacheDecorator", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    beforeEach(async () => {
      providerWithAgreement = CallCacheDecorator(
        () =>
          createAgreementProvider([
            hardhat.ethers.provider,
            hardhat.ethers.provider,
          ]),
        { ttl: 50_000 }
      )() as ProviderWithAgreement;
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
      expect(
        await counter.getCount({
          blockTag: await providerWithAgreement.getBlockNumber(),
        })
      ).to.eq(0);
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
      expect(
        await counter.getCount({
          blockTag: await providerWithAgreement.getBlockNumber(),
        })
      ).to.eq(1);
    });
  });

  describe("with  1 good provider 1 bad provider and 1 always failing", () => {
    let providerWithAgreement: ProviderWithAgreement;
    let counter: Counter;

    const brokenProvider = new providers.StaticJsonRpcProvider(
      "http://blabla.xd"
    );
    const stub = sinon.stub(brokenProvider, "call");

    beforeEach(() => {
      providerWithAgreement = createAgreementProvider([
        brokenProvider,
        new providers.StaticJsonRpcProvider("http://blabla.xd"),
        hardhat.ethers.provider,
      ]);

      // return bad result - should be 0
      stub.onFirstCall().returns(Promise.resolve(`0x${"0".repeat(31)}9`));

      counter = contract.connect(signer.connect(providerWithAgreement));
    });

    it("should read from contract", async () => {
      await expect(
        counter.getCount({
          blockTag: await providerWithAgreement.getBlockNumber(),
        })
      ).rejectedWith(`Failed to find at least 2 agreeing providers.`);
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
      await expect(
        counter.getCount({
          blockTag: await providerWithAgreement.getBlockNumber(),
        })
      ).rejectedWith(`Failed to find at least 2 agreeing providers.`);
    });

    it("should write to contract", async () => {
      await counter.inc();
    });

    it("should await tx", async () => {
      const tx = await counter.inc();
      expect(await tx.wait()).not.to.be.undefined;
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

  describe("Treat0xAsErrorDecorator", () => {
    it("should treat 0x as error", async () => {
      const firstProvider = new providers.StaticJsonRpcProvider(
        "http://blabla.xd"
      );

      const blockTag = await hardhat.ethers.provider.getBlockNumber();

      firstProvider.call = () => Promise.resolve("0x");
      const providerWithAgreement = new ProviderWithAgreement([
        firstProvider,
        hardhat.ethers.provider,
      ]);

      const counter = contract.connect(signer.connect(providerWithAgreement));

      await expect(counter.getCountPlusOne({ blockTag })).rejectedWith(
        /Failed to find at least 2 agreeing providers/
      );
    });
  });

  const describeAgreementAlgorithmFor = (
    operation: (typeof operationsWithAgreement)[number]
  ) =>
    describe("agreement algorithm", () => {
      it("should return 2 when results from providers are [1,2,2]", async () => {
        await testAgreementAlgo(["1", "2", "2"], "2", 2, operation);
      });

      it("should return 2 when results from providers are [error,2,2]", async () => {
        await testAgreementAlgo(["error", "2", "2"], "2", 2, operation);
      });

      it("should return 2 when results from providers are [2,2,error]", async () => {
        await testAgreementAlgo(["2", "2", "error"], "2", 2, operation);
      });

      describe("when 3 providers have to agree", () => {
        it("should return 2 when results from providers are [2,2,2]", async () => {
          await testAgreementAlgo(["2", "2", "2"], "2", 3, operation);
        });

        it("should return 2 when results from providers are [2,2,1]", async () => {
          await expect(
            testAgreementAlgo(["2", "2", "1"], "2", 3, operation)
          ).rejectedWith("Failed to find at least 3 agreeing providers.");
        });

        it("should NOT fail on [error,2], when ignoreAgreementOnInsufficientResponses", async () => {
          await testAgreementAlgo(["2", "2", "error"], "2", 3, operation, true);
        });
      });

      it("should return 2 when results from providers are [2,2,1]", async () => {
        await testAgreementAlgo(["2", "2", "1"], "2", 2, operation);
      });

      it("should return 5 when results from providers are [5,3,5,3,2,4,2,2]", async () => {
        await testAgreementAlgo(
          ["5", "3", "5", "3", "2", "4", "2", "2"],
          "5",
          2,
          operation
        );
      });

      it('should return 2 when results from providers are ["5", "3", "8", "7", "1", "4", "2", "2"]', async () => {
        await testAgreementAlgo(
          ["5", "3", "8", "7", "1", "4", "2", "2"],
          "2",
          2,
          operation
        );
      });

      it("should NOT fail on [2 error error], when ignoreAgreementOnInsufficientResponses", async () => {
        await testAgreementAlgo(
          ["2", "error", "error"],
          "2",
          2,
          operation,
          true
        );
      });

      it("should NOT fail on [2 error error 1 1] and pick response with most votes when ignoreAgreementOnInsufficientResponses", async () => {
        await testAgreementAlgo(
          ["2", "1", "error", "error", "1"],
          "1",
          3,
          operation,
          true
        );
      });

      it("should fail on [error,2]", async () => {
        await expect(
          testAgreementAlgo(["error", "2"], "", 2, operation)
        ).rejectedWith("Failed to find at least 2 agreeing providers.");
      });

      it("should fail on [1,2]", async () => {
        await expect(
          testAgreementAlgo(["1", "2"], "", 2, operation)
        ).rejectedWith("Failed to find at least 2 agreeing providers.");
      });

      it("should fail on [1,2,3,4,5,6,7,8,9]", async () => {
        await expect(
          testAgreementAlgo(
            ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
            "",
            2,
            operation
          )
        ).rejectedWith("Failed to find at least 2 agreeing providers.");
      });
    });

  operationsWithAgreement.forEach(describeAgreementAlgorithmFor);

  describe("With curated list enabled", () => {
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

      const result = await agreementProvider.call(
        {
          to: contract.address,
          data: "0x00",
        },
        await agreementProvider.getBlockNumber()
      );
      expect(result).to.eq("0x");
      expect(callSpy.callCount).to.eq(1);

      // put to qurantine after error
      agreementProvider.curatedRpcList?.evaluateRpcScore("2");

      await agreementProvider.call(
        {
          to: contract.address,
          data: "0x01",
        },
        await agreementProvider.getBlockNumber()
      );
      expect(callSpy.callCount).to.eq(1);

      // free broken provider from qurantine and use it again
      agreementProvider.curatedRpcList?.freeOneRpcFromQuarantine();

      await agreementProvider.call(
        {
          to: contract.address,
          data: "0x02",
        },
        await agreementProvider.getBlockNumber()
      );
      expect(callSpy.callCount).to.eq(2);
    });
  });

  describe("getBlockNumber", () => {
    it("works when at least single success response", async () => {
      await testGetBlockNumber([["error", 1, "error"]], [1]);
    });

    it("throws on all errors", async () => {
      await expect(
        testGetBlockNumber([["error", "error", "error"]], [0])
      ).rejectedWith(/All providers failed to fetch 'getBlockNumber'/);
    });

    it("picks median", async () => {
      await testGetBlockNumber([[1, "error", 2]], [2]);
      await testGetBlockNumber([[1, 6, "error", 2]], [2]);
      await testGetBlockNumber([[3, 4, 1]], [3]);
      await testGetBlockNumber([[3, "error", "error", 8, 100]], [8]);
    });

    it("reject smaller block number, than previous one", async () => {
      await testGetBlockNumber(
        [
          [100, "error", 200],
          [99, 2, 190],
        ],
        [150, 2]
      );
    });

    it("reject block number ahead more then 73 hours", async () => {
      const seventyThreeHoursInEthBlocks = (73 * 3600) / 12;
      await testGetBlockNumber(
        [
          [100, "error", 200],
          [100 + seventyThreeHoursInEthBlocks, 2, 200],
        ],
        [150, 101]
      );
    });
  });
});

const testGetBlockNumber = async (
  providerResponsesPerRound: (number | "error")[][],
  expectedResults: number[]
) => {
  const mockProviders: providers.StaticJsonRpcProvider[] = [];

  for (let i = 0; i < providerResponsesPerRound[0].length; i++) {
    const mockProvider = new providers.StaticJsonRpcProvider(
      `http://${i}.mock`
    );
    const stubOperation = sinon.stub(mockProvider, "getBlockNumber");

    for (let j = 0; j < providerResponsesPerRound.length; j++) {
      const response = providerResponsesPerRound[j][i];
      if (response === "error") {
        stubOperation.onCall(j).rejects(response);
      } else {
        stubOperation.onCall(j).resolves(response);
      }
    }

    mockProviders.push(mockProvider);
  }

  const agreementProvider = new ProviderWithAgreement(mockProviders);

  for (const expected of expectedResults) {
    const result = await agreementProvider.getBlockNumber();
    expect(result.toString()).to.eq(expected.toString());
  }
};

const testAgreementAlgo = async (
  providerResponses: string[],
  expected: string,
  requiredNumberOfProvidersToAgree: number,
  operation: (typeof operationsWithAgreement)[number],
  ignoreAgreementOnInsufficientResponses = false
) => {
  const mockProvider = new providers.StaticJsonRpcProvider("http://blabla.xd");
  const stubOperation = sinon.stub(mockProvider, operation);

  const blockNumber = 1;
  const stubBlockNumber = sinon.stub(mockProvider, "getBlockNumber");
  stubBlockNumber.resolves(blockNumber);

  const agreementProvider = new ProviderWithAgreement(
    new Array<typeof mockProvider>(providerResponses.length).fill(mockProvider),
    {
      numberOfProvidersThatHaveToAgree: requiredNumberOfProvidersToAgree,
      ignoreAgreementOnInsufficientResponses,
    }
  );

  for (let i = 0; i < providerResponses.length; i++) {
    if (providerResponses[i] === "error") {
      stubOperation.onCall(i).rejects(providerResponses[i]);
    } else {
      stubOperation.onCall(i).resolves(providerResponses[i]);
    }
  }

  let result: { toString(): string };
  switch (operation) {
    case "call":
      result = await agreementProvider.call({}, blockNumber);
      break;
    case "getBalance":
      result = await agreementProvider.getBalance("0x", blockNumber);
      break;
  }

  expect(result.toString()).to.eq(expected.toString());
};
