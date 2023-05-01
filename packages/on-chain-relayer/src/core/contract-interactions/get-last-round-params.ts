import { IRedstoneAdapter } from "../../../typechain-types";

export const getLastRoundParamsFromContract = async (
  adapterContract: IRedstoneAdapter
) => {
  const timestamps = await adapterContract.getTimestampsFromLatestUpdate();
  return {
    lastUpdateTimestamp: timestamps.blockTimestamp.toNumber() * 1000,
  };
};
