import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";

let blockTag: undefined | number = undefined;
export const getBlockTag = () => {
  if (blockTag === undefined) {
    throw new Error(
      "BlockTag not defined. Consider calling updateBlockTag method."
    );
  }
  return blockTag;
};

export const updateBlockTag = async (
  adapterContract: MultiFeedAdapterWithoutRounds
) => {
  blockTag = await adapterContract.provider.getBlockNumber();
};
