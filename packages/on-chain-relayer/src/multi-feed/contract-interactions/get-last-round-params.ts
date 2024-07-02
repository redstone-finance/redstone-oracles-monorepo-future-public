import { BigNumber, utils } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";

export type LastRoundDetails = {
  lastDataTimestamp: number;
  lastBlockTimestamp: number;
  lastValue: BigNumber;
};

export const getLastRoundParamsForManyFromContract = async (
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
  const result = contractOutput.map((lastRoundDetails) => {
    return {
      lastDataTimestamp: lastRoundDetails.dataTimestamp.toNumber(),
      lastBlockTimestamp: lastRoundDetails.blockTimestamp.toNumber() * 1000,
      lastValue: lastRoundDetails.value,
    };
  });
  return result;
};
