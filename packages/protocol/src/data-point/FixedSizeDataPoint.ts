import { DataPointBase } from "./DataPointBase";
import { assert, ConvertableToBytes32 } from "../common/utils";

// This data point does not store information about data size in its serialized value
export class FixedSizeDataPoint extends DataPointBase {
  constructor(
    symbol: ConvertableToBytes32,
    value: Uint8Array,
    public readonly fixedValueByteSize: number
  ) {
    super(symbol, value);
    assert(fixedValueByteSize === value.length, "Incorrect value byte size");
  }
}
