import { JsNativeSafeNumber } from "./JsNativeSafeNumber";
import { NumberArg } from "./ISafeNumber";

/** Factory for SafeNumber */
export const createSafeNumber = (numberLike: NumberArg) =>
  JsNativeSafeNumber.from(numberLike);

export const SafeZero = createSafeNumber(0);
