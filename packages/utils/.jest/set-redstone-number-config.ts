import {
  JsNativeSafeNumberConfig,
  NumberValidationResult,
} from "../src/ISafeNumber";

const throwErr = (msg: string) => {
  throw new Error(msg);
};

JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR = {
  [NumberValidationResult.isNaN]: throwErr,
  [NumberValidationResult.isNotFinite]: throwErr,
  [NumberValidationResult.isOverflow]: throwErr,
  [NumberValidationResult.isUnderflow]: throwErr,
};
