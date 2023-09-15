import { IRedstoneAdapter } from "../../../typechain-types";

export type LastRoundTimestamps = {
  lastDataPackageTimestampMS: number;
  lastBlockTimestampMS: number;
};

export const getLastRoundParamsFromContract = async (
  adapterContract: IRedstoneAdapter,
): Promise<LastRoundTimestamps> => {
  const timestamps = await adapterContract.getTimestampsFromLatestUpdate();

  return {
    lastDataPackageTimestampMS: timestamps.dataTimestamp.toNumber(),
    lastBlockTimestampMS: timestamps.blockTimestamp.toNumber() * 1000,
  };
};
