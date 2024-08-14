import Decimal from "decimal.js";
import { BigNumber, BigNumberish } from "ethers";
import * as ISafeNumberMath from "../ISafeNumber";
import { ISafeNumber, createSafeNumber } from "../ISafeNumber";
import { bignumberishToDecimal } from "../common";

export * from "./monotonic-cubic-spline";

export type ConvertibleToISafeNumber =
  | number
  | string
  | Decimal
  | ISafeNumber
  | BigNumber;

export const castToISafeNumber = (
  numberLike: ConvertibleToISafeNumber
): ISafeNumber => {
  if (typeof numberLike === "string" || typeof numberLike === "number") {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike instanceof Decimal) {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike instanceof BigNumber) {
    return createSafeNumber(bignumberishToDecimal(numberLike).toString());
  } else if (numberLike.isSafeNumber()) {
    return numberLike;
  } else {
    throw new Error(`Can not cast ${String(numberLike)} to ISafeNumber`);
  }
};

export const calculateSum = (numbers: ConvertibleToISafeNumber[]) =>
  ISafeNumberMath.calculateSum(numbers.map(castToISafeNumber)).unsafeToNumber();

export const calculateDeviationPercent = (args: {
  baseValue: ConvertibleToISafeNumber;
  deviatedValue: ConvertibleToISafeNumber;
}) =>
  ISafeNumberMath.calculateDeviationPercent({
    baseValue: castToISafeNumber(args.baseValue),
    deviatedValue: castToISafeNumber(args.deviatedValue),
  }).unsafeToNumber();

export const getMedian = (numbers: ConvertibleToISafeNumber[]) =>
  ISafeNumberMath.getMedian(numbers.map(castToISafeNumber)).unsafeToNumber();

export class PrecisionScaler {
  readonly tokenDecimalsScaler: Decimal;

  constructor(readonly tokenDecimals: number) {
    this.tokenDecimalsScaler = new Decimal(10).pow(tokenDecimals);
  }

  toSolidityValue(floatNumber: Decimal.Value): string {
    return new Decimal(floatNumber).mul(this.tokenDecimalsScaler).toString();
  }

  fromSolidityValue(contractValue: BigNumberish): Decimal {
    return bignumberishToDecimal(contractValue).div(this.tokenDecimalsScaler);
  }
}

/** Results are soreted ascending order */
export const filterOutliers = (
  numbers: number[],
  maxDiscrepancy: number
): { representativeGroup: number[]; outliers: number[] } => {
  // if we have only 2 values, we can't set which is outlier which not, so we return two of them
  if (numbers.length <= 2) {
    return { representativeGroup: [...numbers], outliers: [] };
  }

  const sortedNumbers = [...numbers];
  sortedNumbers.sort((a, b) => a - b);

  let bestGroup = { startIndex: 0, endIndex: 0 };

  for (
    let startIndex = bestGroup.startIndex;
    startIndex < sortedNumbers.length;
    startIndex++
  ) {
    for (
      let endIndex = sortedNumbers.length;
      startIndex < endIndex;
      endIndex--
    ) {
      const firstElementValue = sortedNumbers[startIndex];
      const lastElementValue = sortedNumbers[endIndex - 1];

      if (lastElementValue - firstElementValue < maxDiscrepancy) {
        if (endIndex - startIndex > bestGroup.endIndex - bestGroup.startIndex)
          bestGroup = { startIndex, endIndex };
      }
    }
  }

  return {
    representativeGroup: sortedNumbers.slice(
      bestGroup.startIndex,
      bestGroup.endIndex
    ),
    outliers: [
      ...sortedNumbers.slice(0, bestGroup.startIndex),
      ...sortedNumbers.slice(bestGroup.endIndex, sortedNumbers.length),
    ],
  };
};

/** Returns -1 for empty list */
export const weightedRandom = (weights: number[]): number => {
  let totalWeight = 0;

  for (let i = 0; i < weights.length; i++) {
    totalWeight += weights[i];
  }

  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random < 0) {
      return i;
    }
  }

  return weights.length - 1;
};

export const sumBy = <T>(array: T[], extract: (item: T) => number) => {
  const numbers = array.map(extract);

  if (numbers.some((number) => typeof number !== "number")) {
    throw new Error(
      "Can't sumBy because after extraction at least one of elements is not number"
    );
  }

  return numbers.reduce((acc, curr) => acc + curr, 0);
};
