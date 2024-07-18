import { BytesLike, concat, isBytes, toUtf8Bytes } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import {
  DATA_PACKAGES_COUNT_BS,
  REDSTONE_MARKER_HEX,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
} from "../common/redstone-constants";
import { convertIntegerNumberToBytes } from "../common/utils";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import {
  RedstonePayloadParser,
  RedstonePayloadParsingResult,
} from "./RedstonePayloadParser";

export class RedstonePayload extends Serializable {
  constructor(
    public readonly signedDataPackages: SignedDataPackage[],
    public readonly unsignedMetadata: BytesLike
  ) {
    super();
  }

  public static prepare(
    signedDataPackages: SignedDataPackage[],
    unsignedMetadata: BytesLike
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
    const unsignedMetadataBytes = isBytes(this.unsignedMetadata)
      ? this.unsignedMetadata
      : toUtf8Bytes(this.unsignedMetadata);
    const unsignedMetadataByteSizeBytes = convertIntegerNumberToBytes(
      unsignedMetadataBytes.length,
      UNSIGNED_METADATA_BYTE_SIZE_BS
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

  public static parse(
    bytesWithRedstonePayloadInTheEnd: Uint8Array
  ): RedstonePayloadParsingResult {
    return new RedstonePayloadParser(bytesWithRedstonePayloadInTheEnd).parse();
  }
}
