import {
  arrayify,
  concat,
  joinSignature,
  keccak256,
  SigningKey,
} from "ethers/lib/utils";
import {
  DATA_POINTS_COUNT_BS,
  DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS,
  TIMESTAMP_BS,
} from "../common/redstone-consts";
import { Serializable } from "../common/Serializable";
import { convertIntegerNumberToBytes } from "../common/utils";
import { DataPointBase } from "../data-point/DataPointBase";
import { SignedDataPackage } from "./SignedDataPackage";

export abstract class DataPackageBase extends Serializable {
  constructor(
    public readonly dataPoints: DataPointBase[],
    public readonly timestampMilliseconds: number
  ) {
    if (dataPoints.length === 0) {
      throw new Error("Can not create a data package with no data points");
    }
    super();
  }

  protected abstract getDefaultDataPointByteSize(): number;

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
      this.getDefaultDataPointByteSize(),
      DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS
    );
  }
}
