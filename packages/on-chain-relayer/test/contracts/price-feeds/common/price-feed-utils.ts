import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ContractTransaction } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import {
  IRedstoneAdapter,
  MultiFeedAdapterWithoutRoundsMock,
  PriceFeedBase,
} from "../../../../typechain-types";

interface PriceFeedTestsParams {
  priceFeedContractName: string;
  adapterContractName: string;
  expectedRoundIdAfterTwoUpdates: number;
  isMultiFeedAdapter?: boolean;
}

interface PriceFeedTestsContracts {
  adapter: IRedstoneAdapter | MultiFeedAdapterWithoutRoundsMock;
  priceFeed: PriceFeedBase;
}

chai.use(chaiAsPromised);

export const describeCommonPriceFeedTests = ({
  priceFeedContractName,
  adapterContractName,
  expectedRoundIdAfterTwoUpdates,
  isMultiFeedAdapter,
}: PriceFeedTestsParams) => {
  const deployAll = async () => {
    const adapterFactory = await ethers.getContractFactory(adapterContractName);
    const priceFeedFactory = await ethers.getContractFactory(
      priceFeedContractName
    );

    const adapter = await adapterFactory.deploy();
    const priceFeed =
      priceFeedContractName == adapterContractName
        ? adapter
        : await priceFeedFactory.deploy();

    await adapter.deployed();
    await priceFeed.deployed();

    if (priceFeedContractName != adapterContractName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const tx = (await priceFeed.setAdapterAddress(
        adapter.address
      )) as ContractTransaction;
      await tx.wait();
    }

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

      const wrappedContract = WrapperBuilder.wrap(
        contracts.adapter
      ).usingSimpleNumericMock({
        mockSignersCount: 2,
        timestampMilliseconds: mockDataTimestamp,
        dataPoints: [{ dataFeedId: "BTC", value: 42 }],
      });

      if (isMultiFeedAdapter) {
        const tx = await (
          wrappedContract as MultiFeedAdapterWithoutRoundsMock
        ).updateDataFeedsValuesPartial([formatBytes32String("BTC")]);
        await tx.wait();
      } else {
        const tx = await (
          wrappedContract as IRedstoneAdapter
        ).updateDataFeedsValues(mockDataTimestamp);
        await tx.wait();
      }
    };

    beforeEach(async () => {
      contracts = await deployAll();
    });

    it("should revert calling latestRoundData if the value is zero", async () => {
      await expect(contracts.priceFeed.latestRoundData()).to.be.reverted;
    });

    it("should revert calling latestAnswer if the value is zero", async () => {
      await expect(contracts.priceFeed.latestAnswer()).to.be.reverted;
    });

    it("should revert calling getRoundData if the value is zero", async () => {
      await expect(contracts.priceFeed.getRoundData(0)).to.be.reverted;
    });

    it("should properly get latest round data for 1 update", async () => {
      await updatePrices();
      const latestRoundData = await contracts.priceFeed.latestRoundData();
      expect(latestRoundData.roundId.toNumber()).to.eq(1);
      expect(latestRoundData.startedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.updatedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.answer.toNumber()).to.eq(42 * 10 ** 8);
    });

    it("should properly get latest round data for 2 updates", async () => {
      await updatePrices();
      await updatePrices();
      const latestRoundData = await contracts.priceFeed.latestRoundData();
      expect(latestRoundData.roundId.toNumber()).to.eq(
        expectedRoundIdAfterTwoUpdates
      );
      expect(latestRoundData.startedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.updatedAt.toNumber()).to.eq(curBlockTime);
      expect(latestRoundData.answer.toNumber()).to.eq(42 * 10 ** 8);
    });

    it("should properly get latest answer", async () => {
      await updatePrices();
      await updatePrices();
      const latestAnswer = await contracts.priceFeed.latestAnswer();
      expect(latestAnswer.toNumber()).to.eq(42 * 10 ** 8);
    });

    it("should properly get latest round id for 1 update", async () => {
      await updatePrices();
      const latestRoundId = await contracts.priceFeed.latestRound();
      expect(latestRoundId.toNumber()).to.eq(1);
    });

    it("should properly get latest round id for 2 updates", async () => {
      await updatePrices();
      await updatePrices();
      const latestRoundId = await contracts.priceFeed.latestRound();
      expect(latestRoundId.toNumber()).to.eq(expectedRoundIdAfterTwoUpdates);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(contractV1).to.not.be.undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      await expect((contractV1 as any).initialize()).to.rejectedWith(
        "Initializable: contract is already initialized"
      );
      const dataFeed = await contractV1.getDataFeedId();
      expect(dataFeed).to.eq(
        "0x4254430000000000000000000000000000000000000000000000000000000000"
      );

      if (adapterContractName != priceFeedContractName) {
        const adapterAddress = await contractV1.getPriceFeedAdapter();

        expect(adapterAddress).to.eq(
          "0x0000000000000000000000000000000000000000"
        );
      }
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
