import { utils } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { config } from "../../config";
import { ContractData, LastRoundDetails } from "../../types";

export const getLastRoundParamsFromContractMultiFeed = async (
  adapterContract: MultiFeedAdapterWithoutRounds,
  blockTag: number
): Promise<ContractData> => {
  const relayerConfig = config();
  const { dataFeeds } = relayerConfig;

  const dataFromContract: ContractData = {};

  const lastRoundDetails = await getLastUpdateDetailsForManyFromContract(
    adapterContract,
    dataFeeds,
    blockTag
  );

  for (const [index, dataFeedId] of dataFeeds.entries()) {
    dataFromContract[dataFeedId] = lastRoundDetails[index];
  }

  return dataFromContract;
};

export const getLastUpdateDetailsForManyFromContract = async (
  adapterContract: MultiFeedAdapterWithoutRounds,
  dataFeeds: string[],
  blockTag: number
): Promise<LastRoundDetails[]> => {
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const contractOutput: MultiFeedAdapterWithoutRounds.LastUpdateDetailsStructOutput[] =
    await adapterContract.getLastUpdateDetailsUnsafeForMany(
      dataFeedsAsBytes32,
      {
        blockTag,
      }
    );
  const result = contractOutput.map((lastRoundDetails) => ({
    lastDataPackageTimestampMS: lastRoundDetails.dataTimestamp.toNumber(),
    lastBlockTimestampMS: lastRoundDetails.blockTimestamp.toNumber() * 1000,
    lastValue: lastRoundDetails.value,
  }));
  return result;
};
