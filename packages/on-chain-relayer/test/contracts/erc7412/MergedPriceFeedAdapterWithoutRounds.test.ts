import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SimpleNumericMockWrapper } from "@redstone-finance/evm-connector";
import { utils as protocolUtils } from "@redstone-finance/protocol";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { utils } from "ethers";
import hr from "hardhat";
import { RedstonePrimaryProdERC7412Mock } from "../../../typechain-types";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../helpers";
import { describeCommonMergedPriceFeedAdapterTests } from "../price-feeds/common/merged-price-feed-adapter-utils";
import { describeCommonPriceFeedTests } from "../price-feeds/common/price-feed-utils";
import { describeCommonPriceFeedsAdapterTests } from "../price-feeds/common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

const contractName = "RedstonePrimaryProdERC7412Mock";

const TTL_FROM_CONTRACT = 60;

type UpdateValuesParams = { value: number };
const updateValues = async (
  contract: RedstonePrimaryProdERC7412Mock,
  params: UpdateValuesParams
) => {
  const currentBlockTime = await time.latest();

  const dataPackageTimestamp = currentBlockTime * 1000;

  const redstonePayload = await new SimpleNumericMockWrapper({
    timestampMilliseconds: dataPackageTimestamp,
    mockSignersCount: 2,
    dataPoints: [{ dataFeedId: "BTC", value: params.value }],
  }).prepareRedstonePayload(true);

  const nextBlockTimestamp = currentBlockTime + 10;

  const coder = new utils.AbiCoder();
  const encodedDataPackageTimestamp = coder.encode(
    ["uint256"],
    [dataPackageTimestamp]
  );

  // Update one data feed
  await time.setNextBlockTimestamp(nextBlockTimestamp);
  const tx = await contract.fulfillOracleQuery(
    `${encodedDataPackageTimestamp}${redstonePayload}`
  );
  await tx.wait();

  return {
    tx,
  };
};

describe("RedstonePrimaryProdERC7412", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: contractName,
    adapterContractName: contractName,
    expectedRoundIdAfterTwoUpdates: DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
  });

  describeCommonPriceFeedsAdapterTests({
    adapterContractName: contractName,
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
    isErc7412: true,
  });

  describeCommonMergedPriceFeedAdapterTests({
    mergedPriceFeedAdapterContractName: contractName,
    updatedContractName: "MergedPriceFeedAdapterWithoutRoundsUpdatedMock",
    roundsEndabled: false,
  });

  describe("ERC7412 specific logic", () => {
    let contract: RedstonePrimaryProdERC7412Mock;

    beforeEach(async () => {
      contract = (await hr.ethers.deployContract(
        contractName
      )) as RedstonePrimaryProdERC7412Mock;
    });

    it("returns oracleId", async () => {
      const redstoneInHex = utils.hexlify(
        protocolUtils.convertStringToBytes32("REDSTONE")
      );
      expect(await contract.oracleId()).to.equal(redstoneInHex);
    });

    it("should return same value for getDataFeedId and getDataFeedId", async () => {
      const btcInHex = utils.hexlify(
        protocolUtils.convertStringToBytes32("BTC")
      );

      expect(await contract.getDataFeedId()).to.equal(btcInHex);
      expect(await contract.getDataFeedId()).to.equal(btcInHex);
    });

    it("should fail if price was not submitted yet", async () => {
      await expect(contract.latestAnswer()).rejectedWith(/OracleDataRequired/);
    });

    it("should update data using fulfillOracleQuery", async () => {
      await updateValues(contract, { value: 420 });
      expect(await contract.latestAnswer()).to.eq(420 * 1e8);
    });

    it("should return cached data", async () => {
      await updateValues(contract, { value: 420 });

      expect(await contract.latestAnswer()).to.eq(420 * 1e8);

      await time.increase(TTL_FROM_CONTRACT);
      expect(await contract.latestAnswer()).to.eq(420 * 1e8);
    });

    it("should revert on stale data", async () => {
      await updateValues(contract, { value: 430 });

      await time.increase(TTL_FROM_CONTRACT + 1);
      await expect(contract.latestAnswer()).rejectedWith(/OracleDataRequired/);
      await expect(contract.getRoundData(1)).rejectedWith(/OracleDataRequired/);
      await expect(
        contract.getValuesForDataFeeds([await contract.getDataFeedId()])
      ).rejectedWith(/OracleDataRequired/);
      await expect(
        contract.getValueForDataFeed(await contract.getDataFeedId())
      ).rejectedWith(/OracleDataRequired/);
    });
  });
});
