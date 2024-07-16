import { BigNumber } from "ethers";
import { formatUnits, hexlify, toUtf8String } from "ethers/lib/utils";
import {
  DATA_FEED_ID_BS,
  DATA_PACKAGES_COUNT_BS,
  DATA_POINTS_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  DEFAULT_NUM_VALUE_DECIMALS,
  REDSTONE_MARKER_BS,
  REDSTONE_MARKER_HEX,
  SIGNATURE_BS,
  TIMESTAMP_BS,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
} from "../common/redstone-constants";
import { convertBytesToNumber } from "../common/utils";
import { DataPackage } from "../data-package/DataPackage";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import { DataPoint } from "../data-point/DataPoint";
import { NumericDataPoint } from "../data-point/NumericDataPoint";

export interface RedstonePayloadParsingResult {
  signedDataPackages: SignedDataPackage[];
  unsignedMetadata: Uint8Array;
  remainderPrefix: Uint8Array;
}

type SliceConfig = { negativeOffset: number; length: number };

export class RedstonePayloadParser {
  // Last bytes of bytesData must contain valid redstone payload
  constructor(private bytesData: Uint8Array) {}

  parse(): RedstonePayloadParsingResult {
    this.assertValidRedstoneMarker();

    const unsignedMetadata = this.extractUnsignedMetadata();

    let negativeOffset =
      unsignedMetadata.length +
      UNSIGNED_METADATA_BYTE_SIZE_BS +
      REDSTONE_MARKER_BS;

    const numberOfDataPackages = this.extractNumber({
      negativeOffset,
      length: DATA_PACKAGES_COUNT_BS,
    });

    negativeOffset += DATA_PACKAGES_COUNT_BS;

    // Extracting all data packages
    const signedDataPackages: SignedDataPackage[] = [];
    for (let i = 0; i < numberOfDataPackages; i++) {
      const signedDataPackage = this.extractSignedDataPackage(negativeOffset);
      signedDataPackages.push(signedDataPackage);
      negativeOffset += signedDataPackage.toBytes().length;
    }

    // Preparing remainder prefix bytes
    const remainderPrefix = this.slice({
      negativeOffset,
      length: this.bytesData.length - negativeOffset,
    });

    signedDataPackages.reverse(); // reversing, because we read from the end
    return {
      signedDataPackages,
      unsignedMetadata,
      remainderPrefix,
    };
  }

  extractUnsignedMetadata(): Uint8Array {
    const unsignedMetadataSize = this.extractNumber({
      negativeOffset: REDSTONE_MARKER_BS,
      length: UNSIGNED_METADATA_BYTE_SIZE_BS,
    });

    return this.slice({
      negativeOffset: REDSTONE_MARKER_BS + UNSIGNED_METADATA_BYTE_SIZE_BS,
      length: unsignedMetadataSize,
    });
  }

  assertValidRedstoneMarker() {
    const redstoneMarker = this.slice({
      negativeOffset: 0,
      length: REDSTONE_MARKER_BS,
    });
    const redstoneMarkerHex = hexlify(redstoneMarker);

    if (redstoneMarkerHex !== REDSTONE_MARKER_HEX) {
      throw new Error(`Received invalid redstone marker: ${redstoneMarkerHex}`);
    }
  }

  extractSignedDataPackage(initialNegativeOffset: number): SignedDataPackage {
    // Extracting signature
    let negativeOffset = initialNegativeOffset;
    const signature = this.slice({
      negativeOffset,
      length: SIGNATURE_BS,
    });

    // Extracting number of data points
    negativeOffset += SIGNATURE_BS;
    const dataPointsCount = this.extractNumber({
      negativeOffset,
      length: DATA_POINTS_COUNT_BS,
    });

    // Extracting data points value byte size
    negativeOffset += DATA_POINTS_COUNT_BS;
    const dataPointsValueSize = this.extractNumber({
      negativeOffset,
      length: DATA_POINT_VALUE_BYTE_SIZE_BS,
    });

    // Extracting timestamp
    negativeOffset += DATA_POINT_VALUE_BYTE_SIZE_BS;
    const timestamp = this.extractNumber({
      negativeOffset,
      length: TIMESTAMP_BS,
    });

    // Extracting all data points
    negativeOffset += TIMESTAMP_BS;
    const dataPoints: DataPoint[] = [];
    let dataPackageId: string | undefined;
    for (let i = 0; i < dataPointsCount; i++) {
      // Extracting data point value
      const dataPointValue = this.slice({
        negativeOffset,
        length: dataPointsValueSize,
      });

      // Extracting data feed id for data point
      negativeOffset += dataPointsValueSize;
      const dataFeedId = this.slice({
        negativeOffset,
        length: DATA_FEED_ID_BS,
      });

      // Shifting negative offset
      negativeOffset += DATA_FEED_ID_BS;

      // Building a data point
      const dataPoint = RedstonePayloadParser.createDataPoint(
        dataFeedId,
        dataPointValue
      );

      if (!dataPackageId) {
        dataPackageId = dataPoint.dataFeedId;
      } else if (dataPackageId !== dataPoint.dataFeedId) {
        dataPackageId = "__MULTI_POINT__";
      }

      // Collecting data point
      // Using `unshift` instead of `push` because we read from the end
      dataPoints.unshift(dataPoint);
    }

    if (!dataPackageId) {
      dataPackageId = "__EMPTY__";
    }

    return new SignedDataPackage(
      new DataPackage(dataPoints, timestamp, dataPackageId),
      hexlify(signature)
    );
  }

  private static createDataPoint(
    dataFeedId: Uint8Array,
    dataPointValue: Uint8Array
  ): DataPoint {
    return new DataPoint(
      toUtf8String(dataFeedId).replaceAll("\x00", ""),
      dataPointValue
    );
  }

  private extractNumber(sliceConfig: SliceConfig): number {
    const bytesArr = this.slice(sliceConfig);
    return convertBytesToNumber(bytesArr);
  }

  private slice(sliceConfig: SliceConfig): Uint8Array {
    const { negativeOffset, length } = sliceConfig;
    const end = this.bytesData.length - negativeOffset;
    const start = end - length;
    return this.bytesData.slice(start, end);
  }
}

export const convertDataPointToNumericDataPoint = (
  dataPoint: DataPoint,
  decimals?: number
) =>
  new NumericDataPoint({
    value: Number(
      formatUnits(
        BigNumber.from(dataPoint.value),
        decimals ?? DEFAULT_NUM_VALUE_DECIMALS
      )
    ),
    dataFeedId: dataPoint.dataFeedId,
    decimals,
  });
