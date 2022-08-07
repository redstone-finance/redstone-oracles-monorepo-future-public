import { concat, toUtf8Bytes } from "ethers/lib/utils";
import {
  DATA_PACKAGES_COUNT_BS,
  REDSTONE_MARKER_HEX,
  UNSGINED_METADATA_BYTE_SIZE_BS,
} from "./common/redstone-constants";
import { Serializable } from "./common/Serializable";
import { convertIntegerNumberToBytes } from "./common/utils";
import { SignedDataPackage } from "./data-package/SignedDataPackage";

export class RedstonePayload extends Serializable {
  constructor(
    public readonly signedDataPackages: SignedDataPackage[],
    public readonly unsignedMetadata: string
  ) {
    super();
  }

  public static prepare(
    signedDataPackages: SignedDataPackage[],
    unsignedMetadata: string
  ): string {
    return new RedstonePayload(
      signedDataPackages,
      unsignedMetadata
    ).toBytesHexWithout0xPrefix();
  }

  toObj() {
    return {
      signedDataPackages: this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toObj()
      ),
      unsignedMetadata: this.unsignedMetadata,
    };
  }

  toBytes(): Uint8Array {
    return concat([
      this.serializeSignedDataPackages(),
      this.serializeUnsignedMetadata(),
      REDSTONE_MARKER_HEX,
    ]);
  }

  serializeUnsignedMetadata(): Uint8Array {
    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);
    const unsignedMetadataByteSizeBytes = convertIntegerNumberToBytes(
      unsignedMetadataBytes.length,
      UNSGINED_METADATA_BYTE_SIZE_BS
    );
    return concat([unsignedMetadataBytes, unsignedMetadataByteSizeBytes]);
  }

  serializeSignedDataPackages(): Uint8Array {
    return concat([
      ...this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toBytes()
      ),
      convertIntegerNumberToBytes(
        this.signedDataPackages.length,
        DATA_PACKAGES_COUNT_BS
      ),
    ]);
  }
}
