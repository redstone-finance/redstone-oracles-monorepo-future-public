import { Result } from "starknet";
import { BigNumberish } from "ethers";

export function getNumberFromStarknetResult(value: Result | BigNumberish) {
  return Number(value);
}
