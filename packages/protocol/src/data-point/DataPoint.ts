import { base64, concat } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { convertStringToBytes32, ConvertableToBytes32 } from "../common/utils";
import { INumericDataPoint } from "./NumericDataPoint";
import { IStringDataPoint } from "./StringDataPoint";

export interface IStandardDataPoint {
  dataFeedId: ConvertableToBytes32;
  value: string; // base64-encoded bytes
}
export type DataPointPlainObj =
  | INumericDataPoint
  | IStandardDataPoint
  | IStringDataPoint;

export class DataPoint extends Serializable {
  constructor(
    public readonly dataFeedId: ConvertableToBytes32,
    public readonly value: Uint8Array
  ) {
    super();
  }

  serializedataFeedId(): Uint8Array {
    return convertStringToBytes32(this.dataFeedId);
  }

  toObj(): DataPointPlainObj {
    return {
      dataFeedId: this.dataFeedId,
      value: base64.encode(this.value),
    };
  }

  getValueByteSize(): number {
    return this.value.length;
  }

  toBytes(): Uint8Array {
    const serializeddataFeedId = this.serializedataFeedId();
    return concat([serializeddataFeedId, this.value]);
  }
}
