import {
  arrayify,
  concat,
  hexlify,
  keccak256,
  SigningKey,
} from "ethers/lib/utils";
import {
  DATA_POINTS_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  TIMESTAMP_BS,
} from "../common/redstone-constants";
import { Serializable } from "../common/Serializable";
import { assert, convertIntegerNumberToBytes } from "../common/utils";
import { deserializeDataPointFromObj } from "../data-point/data-point-deserializer";
import { DataPoint, DataPointPlainObj } from "../data-point/DataPoint";
import { SignedDataPackage } from "./SignedDataPackage";

export interface DataPackagePlainObj {
  dataPoints: DataPointPlainObj[];
  timestampMilliseconds: number;
}

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
        "Values of all data points in a DataPackage must have the same number of bytes"
      );
    }
  }

  // Each data point in this data package can have a different byte size
  // So we set the default byte size to 0
  getEachDataPointByteSize() {
    return this.dataPoints[0].getValueByteSize();
  }

  toBytes(): Uint8Array {
    return concat([
      this.serializeDataPoints(),
      this.serializeTimestamp(),
      this.serializeDefaultDataPointByteSize(),
      this.serializeDataPointsCount(),
    ]);
  }

  toObj(): DataPackagePlainObj {
    return {
      dataPoints: this.dataPoints.map((dataPoint) => dataPoint.toObj()),
      timestampMilliseconds: this.timestampMilliseconds,
    };
  }

  public static fromObj(plainObject: DataPackagePlainObj): DataPackage {
    const dataPoints = plainObject.dataPoints.map(deserializeDataPointFromObj);
    return new DataPackage(dataPoints, plainObject.timestampMilliseconds);
  }

  getSignableHash(): Uint8Array {
    const serializedDataPackage = this.toBytes();
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
    // Sorting datapoints by bytes32 representation of dataFeedIds lexicographically
    this.dataPoints.sort((dp1, dp2) => {
      const bytes32dataFeedId1Hexlified = hexlify(dp1.serializedataFeedId());
      const bytes32dataFeedId2Hexlified = hexlify(dp2.serializedataFeedId());
      const comparisonResult = bytes32dataFeedId1Hexlified.localeCompare(
        bytes32dataFeedId2Hexlified
      );
      assert(
        comparisonResult !== 0,
        `Duplicated dataFeedId found: ${dp1.dataFeedId}`
      );
      return comparisonResult;
    });
    return concat(this.dataPoints.map((dp) => dp.toBytes()));
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
