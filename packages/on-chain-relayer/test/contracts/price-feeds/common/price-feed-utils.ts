import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { IRedstoneAdapter, PriceFeedBase } from "../../../../typechain-types";
import { formatBytes32String } from "ethers/lib/utils";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { time } from "@nomicfoundation/hardhat-network-helpers";

interface PriceFeedTestsParams {
  priceFeedContractName: string;
  adapterContractName: string;
  expectedRoundIdAfterOneUpdate: number;
}

interface PriceFeedTestsContracts {
  adapter: IRedstoneAdapter;
  priceFeed: PriceFeedBase;
}

chai.use(chaiAsPromised);

export const describeCommonPriceFeedTests = ({
  priceFeedContractName,
  adapterContractName,
  expectedRoundIdAfterOneUpdate,
}: PriceFeedTestsParams) => {
  const deployAll = async () => {
    const adapterFactory = await ethers.getContractFactory(adapterContractName);
    const priceFeedFactory = await ethers.getContractFactory(
      priceFeedContractName
    );

    const adapter = await adapterFactory.deploy();
    const priceFeed = await priceFeedFactory.deploy();

    await adapter.deployed();
    await priceFeed.deployed();

    const tx = await (priceFeed as any).setAdapterAddress(adapter.address);
    await tx.wait();

    return {
      adapter,
      priceFeed,
    } as PriceFeedTestsContracts;
  };

  describe("Tests for getting price feed details", () => {
    let contracts: PriceFeedTestsContracts;

    beforeEach(async () => {
      contracts = await deployAll();
    });

    it("should properly get data feed id", async () => {
      const dataFeedId = await contracts.priceFeed.getDataFeedId();
      expect(dataFeedId).to.eq(formatBytes32String("BTC"));
    });

    it("should properly get price feed adapter", async () => {
      const adapterAddress = await contracts.priceFeed.getPriceFeedAdapter();
      expect(adapterAddress).to.eq(contracts.adapter.address);
    });

    it("should properly get decimals", async () => {
      const decimals = await contracts.priceFeed.decimals();
      expect(decimals).to.eq(8);
    });

    it("should properly get description", async () => {
      const description = await contracts.priceFeed.description();
      expect(description).to.eq("Redstone Price Feed");
    });

    it("should properly get version", async () => {
      const version = await contracts.priceFeed.version();
      expect(version).to.eq(1);
    });
  });

  describe("Tests for getting latest price feed values", () => {
    let contracts: PriceFeedTestsContracts,
      prevBlockTime: number,
      curBlockTime: number,
      mockDataTimestamp: number;

    const updatePrices = async () => {
      prevBlockTime = await time.latest();
      curBlockTime = prevBlockTime + 10;
      mockDataTimestamp = prevBlockTime * 1000;
      await time.setNextBlockTimestamp(curBlockTime);

      const wrappedContract = (await WrapperBuilder.wrap(
        contracts.adapter
      ).usingSimpleNumericMock({
        mockSignersCount: 2,
        timestampMilliseconds: mockDataTimestamp,
        dataPoints: [{ dataFeedId: "BTC", value: 42 }],
      })) as IRedstoneAdapter;

      const tx = await wrappedContract.updateDataFeedsValues(mockDataTimestamp);
      await tx.wait();
    };

    beforeEach(async () => {
      contracts = await deployAll();
      await updatePrices();
    });

    it("should properly get latest round data", async () => {
      const latestRoundData = await contracts.priceFeed.latestRoundData();
      expect(latestRoundData.roundId.toNumber()).to.eq(
        expectedRoundIdAfterOneUpdate
      );
      expect(latestRoundData.startedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.updatedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.answer.toNumber()).to.eq(42 * 10 ** 8);
    });

    it("should properly get latest answer", async () => {
      const latestAnswer = await contracts.priceFeed.latestAnswer();
      expect(latestAnswer.toNumber()).to.eq(42 * 10 ** 8);
    });

    it("should properly get latest round id", async () => {
      const latestRoundId = await contracts.priceFeed.latestRound();
      expect(latestRoundId.toNumber()).to.eq(expectedRoundIdAfterOneUpdate);
    });
  });

  describe("Tests for contract upgrades", () => {
    let contractV1: PriceFeedBase;

    beforeEach(async () => {
      const contractFactory = await ethers.getContractFactory(
        priceFeedContractName
      );
      contractV1 = (await upgrades.deployProxy(
        contractFactory
      )) as PriceFeedBase;
    });

    it("should initialize properly", async () => {
      expect(contractV1).to.not.be.undefined;
      await expect((contractV1 as any).initialize()).to.rejectedWith(
        "Initializable: contract is already initialized"
      );
      const dataFeed = await contractV1.getDataFeedId();
      expect(dataFeed).to.eq(
        "0x4254430000000000000000000000000000000000000000000000000000000000"
      );

      const adapterAddress = await contractV1.getPriceFeedAdapter();

      expect(adapterAddress).to.eq(
        "0x0000000000000000000000000000000000000000"
      );
    });

    describe("should properly upgrade the contract", () => {
      let updatedContract: PriceFeedBase;

      before(async () => {
        const updateContractFactory = await ethers.getContractFactory(
          "PriceFeedUpdatedMock"
        );

        updatedContract = (await upgrades.upgradeProxy(
          contractV1,
          updateContractFactory
        )) as PriceFeedBase;
      });

      it("should change data feed adapter", async () => {
        const dataFeed = await updatedContract.getDataFeedId();

        expect(dataFeed).to.eq(
          "0x4554480000000000000000000000000000000000000000000000000000000000"
        );
      });

      it("should change data feed id", async () => {
        const adapterAddress = await updatedContract.getPriceFeedAdapter();

        expect(adapterAddress).to.eq(
          "0x2C31d00C1AE878F28c58B3aC0672007aECb4A124"
        );
      });
    });
  });
};
