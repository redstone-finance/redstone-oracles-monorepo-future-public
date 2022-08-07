import {
  convertNumberToBytes,
  ConvertableToBytes32,
  useDefaultIfUndefined,
} from "../common/utils";
import {
  DEFAULT_NUM_VALUE_BS,
  DEFAULT_NUM_VALUE_DECIMALS,
} from "../common/redstone-constants";
import { DataPoint } from "./DataPoint";

export interface INumericDataPoint {
  dataFeedId: ConvertableToBytes32;
  value: number;
  decimals?: number;
  valueByteSize?: number;
}

// This data point does not store information about data size in its serialized value
export class NumericDataPoint extends DataPoint {
  constructor(private readonly numericDataPointArgs: INumericDataPoint) {
    const decimals = useDefaultIfUndefined(
      numericDataPointArgs.decimals,
      DEFAULT_NUM_VALUE_DECIMALS
    );
    const valueByteSize = useDefaultIfUndefined(
      numericDataPointArgs.valueByteSize,
      DEFAULT_NUM_VALUE_BS
    );
    const valueBytes = convertNumberToBytes(
      numericDataPointArgs.value,
      decimals,
      valueByteSize
    );
    super(numericDataPointArgs.dataFeedId, valueBytes);
  }

  toObj(): INumericDataPoint {
    return {
      ...this.numericDataPointArgs,
    };
  }
}
