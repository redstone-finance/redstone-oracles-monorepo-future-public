import Decimal from "decimal.js";
import { BigNumber, BigNumberish } from "ethers";
import { bignumberishToDecimal } from "../common";
import * as ISafeNumberMath from "../ISafeNumber";
import { createSafeNumber, ISafeNumber } from "../ISafeNumber";

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

export const filterOutliers = (
  numbers: number[],
  maxDiscrepancy: number
): { representativeGroup: number[]; outliers: number[] } => {
  if (numbers.length < 2) {
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
