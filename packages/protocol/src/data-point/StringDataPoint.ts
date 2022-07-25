import { ConvertableToBytes32 } from "../common/utils";
import { toUtf8Bytes } from "ethers/lib/utils";
import { DataPoint } from "./DataPoint";

export class StringDataPoint extends DataPoint {
  constructor(symbol: ConvertableToBytes32, value: string) {
    const valueBytes = toUtf8Bytes(value);
    super(symbol, valueBytes);
  }

  serializeToBroadcast() {
    return {
      symbol: this.symbol,
      value: this.value.toString(),
    };
  }
}
