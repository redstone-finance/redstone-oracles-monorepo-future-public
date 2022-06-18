import { assert } from "../common/utils";
import { FixedSizeDataPoint } from "../data-point/FixedSizeDataPoint";
import { DataPackageBase } from "./DataPackageBase";

export class FixedSizeDataPackage extends DataPackageBase {
  constructor(
    public readonly dataPoints: FixedSizeDataPoint[],
    public readonly timestampMilliseconds: number
  ) {
    super(dataPoints, timestampMilliseconds);

    // Data points validation
    // dataPoints[0] is always defined, otherwise the `super`
    // call above throws an error
    const expectedDataPointByteSize = dataPoints[0].fixedValueByteSize;
    for (const dataPoint of dataPoints) {
      assert(
        dataPoint.fixedValueByteSize === expectedDataPointByteSize,
        "Values of all data points in FixedSizeDataPackage must have the same byte size"
      );
    }
  }

  // Each data point in this data package can have a different byte size
  // So we set the default byte size to 0
  override getDefaultDataPointByteSize() {
    return this.dataPoints[0].fixedValueByteSize;
  }
}
