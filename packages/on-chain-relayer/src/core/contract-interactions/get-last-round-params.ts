import { BigNumber, Contract, utils } from "ethers";

const parseBigNumberParam = (valueInBigNumber: BigNumber) =>
  Number(utils.formatUnits(valueInBigNumber, 0));

export const getLastRoundParamsFromContract = async (
  managerContract: Contract
) => {
  const [lastRound, lastUpdateTimestamp] =
    await managerContract.getLastRoundParams();
  return {
    lastRound: parseBigNumberParam(lastRound),
    lastUpdateTimestamp: parseBigNumberParam(lastUpdateTimestamp),
  };
};
