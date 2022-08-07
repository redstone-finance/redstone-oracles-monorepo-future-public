import { ConvertableToBytes32 } from "../common/utils";
import { toUtf8Bytes } from "ethers/lib/utils";
import { DataPoint } from "./DataPoint";

export class StringDataPoint extends DataPoint {
  constructor(dataFeedId: ConvertableToBytes32, value: string) {
    const valueBytes = toUtf8Bytes(value);
    super(dataFeedId, valueBytes);
  }
}
