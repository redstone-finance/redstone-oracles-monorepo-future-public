import Decimal from "decimal.js";
import { BigNumber, BigNumberish } from "ethers";
import * as ISafeNumberMath from "../ISafeNumber";
import { createSafeNumber, ISafeNumber } from "../ISafeNumber";

export type ConvertibleToISafeNumber = number | string | Decimal | ISafeNumber;

export const castToISafeNumber = (
  numberLike: ConvertibleToISafeNumber
): ISafeNumber => {
  if (typeof numberLike === "string" || typeof numberLike === "number") {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike instanceof Decimal) {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike.isSafeNumber()) {
    return numberLike;
  } else {
    throw new Error(`Can not cast ${String(numberLike)} to ISafeNumber`);
  }
};

export const calculateSum = (numbers: ConvertibleToISafeNumber[]) =>
  ISafeNumberMath.calculateSum(numbers.map(castToISafeNumber)).unsafeToNumber();

export const calculateDeviationPercent = (args: {
  prevValue: ConvertibleToISafeNumber;
  newValue: ConvertibleToISafeNumber;
}) =>
  ISafeNumberMath.calculateDeviationPercent({
    prevValue: castToISafeNumber(args.prevValue),
    currValue: castToISafeNumber(args.newValue),
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
    return new Decimal(BigNumber.from(contractValue).toHexString()).div(
      this.tokenDecimalsScaler
    );
  }
}
