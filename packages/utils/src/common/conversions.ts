import Decimal from "decimal.js";
import { BigNumber, BigNumberish } from "ethers";

export const bignumberishToDecimal = (value: BigNumberish) =>
  new Decimal(BigNumber.from(value).toHexString());
