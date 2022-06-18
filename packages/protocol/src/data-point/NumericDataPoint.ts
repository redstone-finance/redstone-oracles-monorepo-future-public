import { FixedSizeDataPoint } from "./FixedSizeDataPoint";
import { convertNumberToBytes, ConvertableToBytes32 } from "../common/utils";
import {
  DEFAULT_NUM_VALUE_BYTE_SIZE,
  DEFAULT_NUM_VALUE_PRECISION,
} from "../common/redstone-consts";

// This data point does not store information about data size in its serialized value
export class NumericDataPoint extends FixedSizeDataPoint {
  constructor(
    symbol: ConvertableToBytes32,
    value: number,
    precision: number = DEFAULT_NUM_VALUE_PRECISION,
    byteSize: number = DEFAULT_NUM_VALUE_BYTE_SIZE
  ) {
    const valueBytes = convertNumberToBytes(value, precision, byteSize);
    super(symbol, valueBytes, byteSize);
  }
}
