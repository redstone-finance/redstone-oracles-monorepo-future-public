import { ConvertableToBytes32 } from "../common/utils";
import { DynamicDataPoint } from "./DynamicDataPoint";
import { toUtf8Bytes } from "ethers/lib/utils";

export class StringDataPoint extends DynamicDataPoint {
  constructor(symbol: ConvertableToBytes32, value: string) {
    const valueBytes = toUtf8Bytes(value);
    super(symbol, valueBytes);
  }
}
