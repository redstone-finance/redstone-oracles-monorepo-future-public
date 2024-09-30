import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";

const DEFAULT_DECIMALS = 18;

export const decimalsMultiplier = parseUnits("1.0", DEFAULT_DECIMALS);

export const bigNumberToFloat = (bignum: BigNumber) =>
  parseFloat(formatUnits(bignum, DEFAULT_DECIMALS));

export const normalizeDecimals = (
  reserve: BigNumber,
  decimals: number
): BigNumber => {
  if (decimals > DEFAULT_DECIMALS) {
    throw new Error(`Can not normalize reserve decimals: ${decimals}`);
  }
  const decimalsRequired = DEFAULT_DECIMALS - decimals;
  return reserve.mul(parseUnits("1.0", decimalsRequired));
};
