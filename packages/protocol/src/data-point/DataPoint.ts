import { base64, concat } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { convertStringToBytes32 } from "../common/utils";
import { ConvertableToBytes32 } from "../index-old";
import { INumericDataPoint } from "./NumericDataPoint";

export interface IStandardDataPoint {
  symbol: ConvertableToBytes32;
  value: string; // base64-encoded bytes
}
export type DataPointPlainObj = INumericDataPoint | IStandardDataPoint;

export class DataPoint extends Serializable {
  constructor(
    public readonly symbol: ConvertableToBytes32,
    public readonly value: Uint8Array
  ) {
    super();
  }

  serializeSymbol(): Uint8Array {
    return convertStringToBytes32(this.symbol);
  }

  toObj(): DataPointPlainObj {
    return {
      symbol: this.symbol,
      value: base64.encode(this.value),
    };
  }

  getValueByteSize(): number {
    return this.value.length;
  }

  toBytes(): Uint8Array {
    const serializedSymbol = this.serializeSymbol();
    return concat([serializedSymbol, this.value]);
  }
}
