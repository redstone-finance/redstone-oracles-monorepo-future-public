import { DynamicDataPoint } from "../data-point/DynamicDataPoint";
import { DataPackageBase } from "./DataPackageBase";

export class DynamicDataPackage extends DataPackageBase {
  constructor(dataPoints: DynamicDataPoint[], timestampMilliseconds: number) {
    super(dataPoints, timestampMilliseconds);
  }

  // Each data point in this data package can have a different byte size
  // So we set the default byte size to 0
  override getDefaultDataPointByteSize() {
    return 0;
  }
}
