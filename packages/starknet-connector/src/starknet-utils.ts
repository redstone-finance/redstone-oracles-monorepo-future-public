import { BigNumberish } from "ethers";
import { Result } from "starknet";

export function getNumberFromStarknetResult(value: Result | BigNumberish) {
  return Number(value);
}
