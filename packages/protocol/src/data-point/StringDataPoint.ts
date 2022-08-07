import { ConvertableToBytes32 } from "../common/utils";
import { toUtf8Bytes } from "ethers/lib/utils";
import { DataPoint } from "./DataPoint";

export interface IStringDataPoint {
  dataFeedId: ConvertableToBytes32;
  value: string;
}

export class StringDataPoint extends DataPoint {
  constructor(stringDataPointArgs: IStringDataPoint) {
    const valueBytes = toUtf8Bytes(stringDataPointArgs.value);
    super(stringDataPointArgs.dataFeedId, valueBytes);
  }
}
