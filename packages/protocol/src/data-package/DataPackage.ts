import { arrayify, concat, keccak256, SigningKey } from "ethers/lib/utils";
import {
  DATA_POINTS_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  TIMESTAMP_BS,
} from "../common/redstone-consts";
import { Serializable } from "../common/Serializable";
import { assert, convertIntegerNumberToBytes } from "../common/utils";
import { DataPoint } from "../data-point/DataPoint";
import { SignedDataPackage } from "./SignedDataPackage";

export class DataPackage extends Serializable {
  constructor(
    public readonly dataPoints: DataPoint[],
    public readonly timestampMilliseconds: number
  ) {
    super();

    if (dataPoints.length === 0) {
      throw new Error("Can not create a data package with no data points");
    }

    const expectedDataPointByteSize = dataPoints[0].getValueByteSize();
    for (const dataPoint of dataPoints) {
      assert(
        dataPoint.getValueByteSize() === expectedDataPointByteSize,
        "Values of all data points in DataPackage must have the same number of bytes"
      );
    }
  }

  // Each data point in this data package can have a different byte size
  // So we set the default byte size to 0
  getEachDataPointByteSize() {
    return this.dataPoints[0].getValueByteSize();
  }

  serializeToBytes(): Uint8Array {
    return concat([
      this.serializeDataPoints(),
      this.serializeTimestamp(),
      this.serializeDefaultDataPointByteSize(),
      this.serializeDataPointsCount(),
    ]);
  }

  getSignableHash(): Uint8Array {
    const serializedDataPackage = this.serializeToBytes();
    const signableHashHex = keccak256(serializedDataPackage);
    return arrayify(signableHashHex);
  }

  sign(privateKey: string): SignedDataPackage {
    // Prepare hash for signing
    const signableHashBytes = this.getSignableHash();

    // Generating a signature
    const signingKey = new SigningKey(privateKey);
    const fullSignature = signingKey.signDigest(signableHashBytes);

    // Return a signed data package
    return new SignedDataPackage(this, fullSignature);
  }

  protected serializeDataPoints(): Uint8Array {
    return concat(this.dataPoints.map((dp) => dp.serializeToBytes()));
  }

  protected serializeTimestamp(): Uint8Array {
    return convertIntegerNumberToBytes(
      this.timestampMilliseconds,
      TIMESTAMP_BS
    );
  }

  protected serializeDataPointsCount(): Uint8Array {
    return convertIntegerNumberToBytes(
      this.dataPoints.length,
      DATA_POINTS_COUNT_BS
    );
  }

  protected serializeDefaultDataPointByteSize(): Uint8Array {
    return convertIntegerNumberToBytes(
      this.getEachDataPointByteSize(),
      DATA_POINT_VALUE_BYTE_SIZE_BS
    );
  }
}
