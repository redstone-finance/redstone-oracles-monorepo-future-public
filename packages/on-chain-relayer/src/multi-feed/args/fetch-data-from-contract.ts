import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { config } from "../config";
import { getBlockTag } from "../contract-interactions/get-block-tag";
import {
  LastRoundDetails,
  getLastRoundParamsForManyFromContract,
} from "../contract-interactions/get-last-round-params";

export type ContractData = {
  [dataFeedsId: string]: LastRoundDetails;
};

export const fetchDataFromContract = async (
  adapterContract: MultiFeedAdapterWithoutRounds
): Promise<ContractData> => {
  const relayerConfig = config();
  const { dataFeeds } = relayerConfig;

  const blockTag = getBlockTag();

  const dataFromContract: ContractData = {};

  const lastRoundDetails = await getLastRoundParamsForManyFromContract(
    adapterContract,
    dataFeeds,
    blockTag
  );

  for (const [index, dataFeedId] of dataFeeds.entries()) {
    dataFromContract[dataFeedId] = lastRoundDetails[index];
  }

  return dataFromContract;
};
