import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../../typechain-types";

export const getUniqueSignersThresholdFromContract = async (
  adapterContract: RedstoneAdapterBase | MultiFeedAdapterWithoutRounds,
  blockTag: number
) => {
  return await adapterContract.getUniqueSignersThreshold({ blockTag });
};
