import { toUtf8Bytes } from "ethers/lib/utils";
import { ConvertibleToBytes32 } from "../common/utils";
import { DataPoint } from "./DataPoint";

export interface IStringDataPoint {
  dataFeedId: ConvertibleToBytes32;
  value: string;
}

export class StringDataPoint extends DataPoint {
  constructor(stringDataPointArgs: IStringDataPoint) {
    const valueBytes = toUtf8Bytes(stringDataPointArgs.value);
    super(stringDataPointArgs.dataFeedId, valueBytes);
  }
}
