import {
  DEFAULT_NUM_VALUE_BS,
  DEFAULT_NUM_VALUE_DECIMALS,
  MAX_NUM_VALUE_BS,
} from "../common/redstone-constants";
import {
  ConvertibleToBytes32,
  assert,
  convertNumberToBytes,
  useDefaultIfUndefined,
} from "../common/utils";
import { DataPoint, Metadata } from "./DataPoint";

export interface INumericDataPoint {
  dataFeedId: ConvertibleToBytes32;
  value: number;
  decimals?: number;
  valueByteSize?: number;
  metadata?: Metadata;
}

export const getNumericDataPointDecimals = (
  dataPoint: INumericDataPoint
): number => dataPoint.decimals ?? DEFAULT_NUM_VALUE_DECIMALS;

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
    assert(
      valueByteSize <= MAX_NUM_VALUE_BS,
      `The byte size of the numeric value cannot be greater than ${MAX_NUM_VALUE_BS}`
    );

    const valueBytes = convertNumberToBytes(
      numericDataPointArgs.value,
      decimals,
      valueByteSize
    );
    super(
      numericDataPointArgs.dataFeedId,
      valueBytes,
      numericDataPointArgs.metadata
    );
  }

  override toObj(): INumericDataPoint {
    return {
      ...this.numericDataPointArgs,
    };
  }
}
