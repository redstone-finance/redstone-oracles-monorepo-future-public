import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { getBlockTag } from "./get-block-tag";

let uniqueSignersThreshold: undefined | number = undefined;
export const getUniqueSignersThresholdFromContract = async (
  adapterContract: MultiFeedAdapterWithoutRounds
) => {
  if (uniqueSignersThreshold === undefined) {
    uniqueSignersThreshold = await adapterContract.getUniqueSignersThreshold({
      blockTag: getBlockTag(),
    });
  }
  return uniqueSignersThreshold;
};
