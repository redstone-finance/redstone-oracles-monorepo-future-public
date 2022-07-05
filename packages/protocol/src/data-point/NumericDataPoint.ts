import _ from "lodash";
import {
  convertNumberToBytes,
  ConvertableToBytes32,
  useDefaultIfUndefined,
} from "../common/utils";
import {
  DEFAULT_NUM_VALUE_BS,
  DEFAULT_NUM_VALUE_DECIMALS,
} from "../common/redstone-consts";
import { DataPoint } from "./DataPoint";

export interface INumericDataPoint {
  symbol: ConvertableToBytes32;
  value: number;
  decimals?: number;
  valueByteSize?: number;
}

// This data point does not store information about data size in its serialized value
export class NumericDataPoint extends DataPoint {
  constructor(args: INumericDataPoint) {
    const decimals = useDefaultIfUndefined(
      args.decimals,
      DEFAULT_NUM_VALUE_DECIMALS
    );
    const valueByteSize = useDefaultIfUndefined(
      args.valueByteSize,
      DEFAULT_NUM_VALUE_BS
    );
    const valueBytes = convertNumberToBytes(
      args.value,
      decimals,
      valueByteSize
    );
    super(args.symbol, valueBytes);
  }
}
