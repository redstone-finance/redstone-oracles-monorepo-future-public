import { loggerFactory } from "../logger";
import { ISafeNumber, NumberArg } from "./ISafeNumber";

export enum NumberValidationResult {
  isOk,
  isNaN,
  isNotFinite,
  isOverflow,
  isUnderflow,
}

export type NumberValidationError = Exclude<
  NumberValidationResult,
  NumberValidationResult.isOk
>;

const logger = loggerFactory("JsNativeSafeNumber");

export const JsNativeSafeNumberConfig = {
  MAX_NUMBER: Number.MAX_SAFE_INTEGER,
  MIN_NUMBER: 1e-14,
  MAX_DECIMALS: 14,
  DIGIT_REGEXP: /^[-+]?(\d+(\.\d{1,63})?|\.\d{1,63})([eE][-+]?\d+)?$/,
  ON_NUMBER_VALIDATION_ERROR: {
    [NumberValidationResult.isNaN]: (msg) => {
      throw new Error(msg);
    },
    [NumberValidationResult.isNotFinite]: (msg) => {
      throw new Error(msg);
    },
    [NumberValidationResult.isOverflow]: logger.error.bind(logger),
    [NumberValidationResult.isUnderflow]: () => {},
  } as Record<NumberValidationError, (msg: string) => unknown>,
  EPSILON: 1e-14,
};

export class JsNativeSafeNumber implements ISafeNumber {
  /** This method should only be called by factory {N} */
  static from(numberLike: NumberArg): JsNativeSafeNumber {
    if (numberLike instanceof JsNativeSafeNumber) {
      return new JsNativeSafeNumber(numberLike.unsafeToNumber());
    } else if (
      typeof numberLike === "number" ||
      typeof numberLike === "string"
    ) {
      return new JsNativeSafeNumber(parseToSafeNumber(numberLike));
    } else {
      throw new Error(
        `Invalid number format: Tried to create JsNativeSafeNumber from ${JSON.stringify(
          numberLike
        )}`
      );
    }
  }

  private _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  decimals(): number {
    return JsNativeSafeNumberConfig.MAX_DECIMALS;
  }

  toString(): string {
    return this._value.toString();
  }

  isSafeNumber(): boolean {
    return true;
  }

  abs(): JsNativeSafeNumber {
    const result = Math.abs(this._value);
    return this.produceNewSafeNumber(result);
  }

  log2(): JsNativeSafeNumber {
    const result = Math.log2(this._value);
    return this.produceNewSafeNumber(result);
  }

  mod(divisor: NumberArg): JsNativeSafeNumber {
    const result =
      this._value % JsNativeSafeNumber.from(divisor).unsafeToNumber();
    return this.produceNewSafeNumber(result);
  }

  round(): JsNativeSafeNumber {
    const result = Math.round(this._value);
    // no validation needed
    return new JsNativeSafeNumber(result);
  }

  add(numberLike: NumberArg): JsNativeSafeNumber {
    const result =
      this._value + JsNativeSafeNumber.from(numberLike).unsafeToNumber();

    return this.produceNewSafeNumber(result);
  }

  sub(numberLike: NumberArg): JsNativeSafeNumber {
    const result =
      this._value - JsNativeSafeNumber.from(numberLike).unsafeToNumber();

    return this.produceNewSafeNumber(result);
  }

  div(numberLike: NumberArg): JsNativeSafeNumber {
    const result =
      this._value / JsNativeSafeNumber.from(numberLike).unsafeToNumber();

    return this.produceNewSafeNumber(result);
  }

  mul(numberLike: NumberArg): JsNativeSafeNumber {
    const result =
      this._value * JsNativeSafeNumber.from(numberLike).unsafeToNumber();

    return this.produceNewSafeNumber(result);
  }

  assertNonNegative() {
    if (this._value < 0) {
      throw new Error("Assert non negative failed");
    }
  }

  assertPositive() {
    if (this._value <= 0) {
      throw new Error("Assert non positive failed");
    }
  }

  /** In the case of this implementation it is actually safe. */
  unsafeToNumber(): number {
    return this._value;
  }

  eq(numberArg: NumberArg): boolean {
    const number = JsNativeSafeNumber.from(numberArg);

    return (
      Math.abs(number.unsafeToNumber() - this._value) <
      JsNativeSafeNumberConfig.EPSILON
    );
  }

  lt(numberArg: NumberArg): boolean {
    return this._value < JsNativeSafeNumber.from(numberArg).unsafeToNumber();
  }

  lte(numberArg: NumberArg): boolean {
    return this.lt(numberArg) || this.eq(numberArg);
  }

  gt(numberArg: NumberArg): boolean {
    return this._value > JsNativeSafeNumber.from(numberArg).unsafeToNumber();
  }

  gte(numberArg: NumberArg): boolean {
    return this.gt(numberArg) || this.eq(numberArg);
  }

  toJSON(): number {
    return this.unsafeToNumber();
  }

  private produceNewSafeNumber(result: number) {
    const newNumber = new JsNativeSafeNumber(result);
    newNumber.assertValidAndRound();
    return newNumber;
  }

  private assertValidAndRound() {
    const { result: validationResult, message } = validateNumber(this._value);

    if (validationResult !== NumberValidationResult.isOk) {
      JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
        message
      );
    }

    this._value = Number(
      this._value.toFixed(JsNativeSafeNumberConfig.MAX_DECIMALS)
    );
  }
}

const validateNumber = (
  number: number
): { result: NumberValidationResult; message: string } => {
  if (Number.isNaN(number)) {
    return {
      result: NumberValidationResult.isNaN,
      message: "Invalid number format: number is NaN",
    };
  } else if (!Number.isFinite(number)) {
    return {
      result: NumberValidationResult.isNotFinite,
      message: "Invalid number format: number is not finite",
    };
  }

  if (Math.abs(number) > JsNativeSafeNumberConfig.MAX_NUMBER) {
    return {
      result: NumberValidationResult.isOverflow,
      message: `Invalid number format: Number is bigger than max number acceptable by REDSTONE ${number}`,
    };
  }
  if (Math.abs(number) < JsNativeSafeNumberConfig.MIN_NUMBER && number !== 0) {
    return {
      result: NumberValidationResult.isUnderflow,
      message: `Invalid number format: Number is smaller than min number acceptable by REDSTONE ${number}`,
    };
  }

  return { result: NumberValidationResult.isOk, message: "" };
};

const parseToSafeNumber = (value: number | string) => {
  let number;
  if (typeof value === "string") {
    if (!JsNativeSafeNumberConfig.DIGIT_REGEXP.test(value)) {
      throw new Error(
        `Invalid number format: ${value}, not matching regexp: ${JsNativeSafeNumberConfig.DIGIT_REGEXP}`
      );
    }
    number = Number(value);
  } else if (typeof value === "number") {
    number = Number(value);
  } else {
    throw new Error(`Invalid number format, expected: string or number`);
  }

  const { result: validationResult, message } = validateNumber(number);
  if (validationResult !== NumberValidationResult.isOk) {
    JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
      message
    );
  }

  return number;
};
