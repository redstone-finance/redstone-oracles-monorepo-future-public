import { RedstoneAdapterBase } from "../../../typechain-types";

export const getUniqueSignersThresholdFromContract = async (
  adapterContract: RedstoneAdapterBase,
  blockTag: number
) => {
  return await adapterContract.getUniqueSignersThreshold({ blockTag });
};
