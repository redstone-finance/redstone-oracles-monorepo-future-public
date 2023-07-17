import { RedstoneAdapterBase } from "../../../typechain-types";

export const getUniqueSignersThresholdFromContract = async (
  adapterContract: RedstoneAdapterBase
) => {
  return await adapterContract.getUniqueSignersThreshold();
};
