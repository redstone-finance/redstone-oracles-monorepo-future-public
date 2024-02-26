import { ISafeNumber, NumberArg } from "./ISafeNumber";
import { SafeZero, createSafeNumber } from "./ISafeNumberFactory";

export const calculateSum = (numbers: NumberArg[]) =>
  numbers.reduce<ISafeNumber>((prev, curr) => prev.add(curr), SafeZero);

export const calculateAverageValue = (numbers: NumberArg[]): ISafeNumber => {
  if (numbers.length === 0) {
    throw new Error("Can not calculate an average value for an empty array");
  }
  const result = calculateSum(numbers).div(numbers.length);

  return result;
};

export const calculateDeviationPercent = (args: {
  baseValue: ISafeNumber;
  deviatedValue: ISafeNumber;
}) => {
  const { baseValue, deviatedValue } = args;

  if (baseValue.eq(0)) {
    return createSafeNumber(Number.MAX_SAFE_INTEGER);
  }

  const result = deviatedValue.sub(baseValue).div(baseValue).abs().mul(100);

  return result;
};

export function getMedian(numbers: ISafeNumber[]): ISafeNumber {
  if (numbers.length === 0) {
    throw new Error("Cannot get median value of an empty array");
  }

  numbers = numbers.sort((a, b) => (a.lt(b) ? -1 : 1));

  const middle = Math.floor(numbers.length / 2);

  if (numbers.length % 2 === 0) {
    return numbers[middle].add(numbers[middle - 1]).div(2);
  } else {
    return numbers[middle];
  }
}
