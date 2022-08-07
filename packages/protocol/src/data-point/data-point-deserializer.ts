import { base64 } from "ethers/lib/utils";
import { DataPoint, DataPointPlainObj } from "./DataPoint";
import { INumericDataPoint, NumericDataPoint } from "./NumericDataPoint";

// This function was moved to a separate file, because it was not
// possible to make it as a static method in the DataPoint class.
// It would cause circularly importing classes, which is not supported
// More info here: https://stackoverflow.com/a/44727578
export const deserializeDataPointFromObj = (
  plainObject: DataPointPlainObj
): DataPoint => {
  if (typeof plainObject.value == "number") {
    return new NumericDataPoint(plainObject as INumericDataPoint);
  } else {
    return new DataPoint(
      plainObject.dataFeedId,
      base64.decode(plainObject.value)
    );
  }
};
