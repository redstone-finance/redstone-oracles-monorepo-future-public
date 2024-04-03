import { consts } from "@redstone-finance/protocol";
import { equal } from "assert";
import { BigNumber } from "ethers";

export function splitPayloadHex(payloadHex: string) {
  //TODO: assert value size == 32;

  const DATA_PACKAGE_BS =
    consts.DATA_FEED_ID_BS +
    consts.DEFAULT_NUM_VALUE_BS +
    consts.TIMESTAMP_BS +
    consts.DATA_POINTS_COUNT_BS +
    consts.DATA_POINT_VALUE_BYTE_SIZE_BS +
    consts.SIGNATURE_BS;

  const unsignedMetadataBS = BigNumber.from(
    "0x" +
      payloadHex.substring(
        payloadHex.length -
          2 *
            (consts.REDSTONE_MARKER_BS + consts.UNSIGNED_METADATA_BYTE_SIZE_BS),
        payloadHex.length - 2 * consts.REDSTONE_MARKER_BS
      )
  ).toNumber();

  const metadataBS =
    consts.REDSTONE_MARKER_BS +
    consts.UNSIGNED_METADATA_BYTE_SIZE_BS +
    unsignedMetadataBS +
    consts.DATA_PACKAGES_COUNT_BS;

  const metadata = payloadHex.substring(
    payloadHex.length - 2 * metadataBS,
    payloadHex.length
  );

  const dataPackageCount = BigNumber.from(
    "0x" + metadata.substring(0, consts.DATA_PACKAGES_COUNT_BS * 2)
  ).toNumber();

  equal(
    payloadHex.length - 2 * metadataBS,
    2 * DATA_PACKAGE_BS * dataPackageCount,
    "Must be implemented for multi-datapoint packages"
  );

  const dataPackageChunks: string[] = [];
  for (let i = 0; i < dataPackageCount; i++) {
    dataPackageChunks.push(
      payloadHex.substring(
        i * 2 * DATA_PACKAGE_BS,
        (i + 1) * 2 * DATA_PACKAGE_BS
      )
    );
  }

  return { dataPackageChunks, metadata };
}
