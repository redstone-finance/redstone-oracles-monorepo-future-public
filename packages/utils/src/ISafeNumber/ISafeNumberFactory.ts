import { NumberArg } from "./ISafeNumber";
import { JsNativeSafeNumber } from "./JsNativeSafeNumber";

/** Factory for SafeNumber */
export const createSafeNumber = (numberLike: NumberArg) =>
  JsNativeSafeNumber.from(numberLike);

export const SafeZero = createSafeNumber(0);
