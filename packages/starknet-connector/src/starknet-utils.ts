import { BigNumberish } from "ethers";
import { Result } from "starknet";

export function getNumberFromStarknetResult(value: Result | BigNumberish) {
  return Number(value);
}

export function extractNumbers(response: Result): number[] {
  return (response as Result[]).map(getNumberFromStarknetResult);
}
