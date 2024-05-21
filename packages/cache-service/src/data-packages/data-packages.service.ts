import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import {
  UniversalSigner,
  consts,
  recoverDeserializedSignerAddress,
} from "@redstone-finance/protocol";
import { getDataServiceIdForSigner } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { DataPackagesBroadcaster } from "../broadcasters/data-packages-broadcaster";
import { MongoBroadcaster } from "../broadcasters/mongo-broadcaster";
import { StreamrBroadcaster } from "../broadcasters/streamr-broadcaster";
import { EMPTY_DATA_PACKAGE_RESPONSE_ERROR_CODE } from "../common/errors";
import config from "../config";
import { getOracleState } from "../utils/get-oracle-state";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
  ReceivedDataPackage,
} from "./data-packages.interface";
import {
  CachedDataPackage,
  DataPackage,
  DataPackageDocumentAggregated,
  DataPackageDocumentMostRecentAggregated,
} from "./data-packages.model";

export interface StatsRequestParams {
  fromTimestamp: number;
  toTimestamp: number;
}

@Injectable()
export class DataPackagesService {
  private readonly logger = new Logger(DataPackagesService.name);
  private readonly broadcasters: DataPackagesBroadcaster[] = [];

  constructor(
    @Optional() private readonly mongoBroadcaster?: MongoBroadcaster,
    @Optional() private readonly streamrBroadcaster?: StreamrBroadcaster
  ) {
    if (mongoBroadcaster) {
      this.broadcasters.push(mongoBroadcaster);
    }
    if (streamrBroadcaster) {
      this.broadcasters.push(streamrBroadcaster);
    }

    this.logger.log(
      `Active broadcasters:  ${this.broadcasters
        .map((broadcaster) => broadcaster.constructor.name)
        .join(",")}`
    );
  }

  /**  Save dataPackages to DB and streamr (optionally) */
  async broadcast(
    dataPackagesToSave: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const savePromises: Promise<unknown>[] = this.broadcasters.map(
      (broadcaster) => broadcaster.broadcast(dataPackagesToSave, nodeEvmAddress)
    );

    await Promise.allSettled(savePromises);
  }

  getLatestDataPackagesWithSameTimestampWithCache = RedstoneCommon.memoize({
    functionToMemoize: (dataServiceId: string) =>
      this.getLatestDataPackagesFromDbWithSameTimestamp(dataServiceId),
    ttl: config.dataPackagesTTL,
  });

  getLatestDataPackagesWithCache = RedstoneCommon.memoize({
    functionToMemoize: (dataServiceId: string) =>
      DataPackagesService.getDataPackagesFromDbByTimestampOrLatest(
        dataServiceId
      ),
    ttl: config.dataPackagesTTL,
  });

  static async getDataPackagesByTimestamp(
    dataServiceId: string,
    timestamp: number
  ): Promise<DataPackagesResponse> {
    return await DataPackagesService.getDataPackagesFromDbByTimestampOrLatest(
      dataServiceId,
      timestamp
    );
  }

  static async isDataServiceIdValid(dataServiceId: string): Promise<boolean> {
    const oracleRegistryState = await getOracleState();
    return !!oracleRegistryState.dataServices[dataServiceId];
  }

  /**
   * Packages might have different timestamps if timestamp not passed
   * */
  static async getDataPackagesFromDbByTimestampOrLatest(
    dataServiceId: string,
    timestamp?: number
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: DataPackagesResponse = {};

    const groupedDataPackages =
      await DataPackage.aggregate<DataPackageDocumentMostRecentAggregated>([
        {
          $match: {
            dataServiceId,
            timestampMilliseconds: timestamp
              ? new Date(timestamp)
              : {
                  $gte: new Date(Date.now() - config.maxAllowedTimestampDelay),
                },
          },
        },
        {
          $group: {
            _id: {
              signerAddress: "$signerAddress",
              dataFeedId: "$dataFeedId",
            },
            timestampMilliseconds: { $first: "$timestampMilliseconds" },
            signature: { $first: "$signature" },
            dataPoints: { $first: "$dataPoints" },
            dataServiceId: { $first: "$dataServiceId" },
            dataFeedId: { $first: "$dataFeedId" },
            dataPackageId: { $first: "$dataPackageId" },
            isSignatureValid: { $first: "$isSignatureValid" },
          },
        },
        {
          $sort: { timestampMilliseconds: -1 },
        },
      ]);

    if (groupedDataPackages.length === 0) {
      throw new HttpException(
        "Data packages response is empty",
        EMPTY_DATA_PACKAGE_RESPONSE_ERROR_CODE
      );
    }

    // Parse DB response
    for (const dataPackage of groupedDataPackages) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { _id, ...rest } = dataPackage;
      const dataPackageId = _id.dataFeedId;
      if (!fetchedPackagesPerDataFeed[dataPackageId]) {
        fetchedPackagesPerDataFeed[dataPackageId] = [];
      }

      fetchedPackagesPerDataFeed[dataPackageId]!.push({
        ...rest,
        timestampMilliseconds: rest.timestampMilliseconds.getTime(),
        signerAddress: _id.signerAddress,
      });
    }

    return fetchedPackagesPerDataFeed;
  }

  /**
   * All packages will share common timestamp
   *  */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getLatestDataPackagesFromDbWithSameTimestamp(
    dataServiceId: string
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: DataPackagesResponse = {};

    const groupedDataPackages =
      await DataPackage.aggregate<DataPackageDocumentAggregated>([
        {
          $match: {
            dataServiceId,
            timestampMilliseconds: {
              $gte: new Date(Date.now() - config.maxAllowedTimestampDelay),
            },
          },
        },
        {
          $group: {
            _id: {
              timestampMilliseconds: "$timestampMilliseconds",
            },
            uniqueFeedSignerPairs: {
              $addToSet: {
                dataFeedId: "$dataFeedId",
                signerAddress: "$signerAddress",
              },
            },
            count: { $count: {} },
            signatures: { $push: "$signature" },
            dataPoints: { $push: "$dataPoints" },
            dataFeedIds: { $push: "$dataFeedId" },
            dataPackageIds: { $push: "$dataPackageId" },
            signerAddress: { $push: "$signerAddress" },
            isSignatureValid: { $push: "$isSignatureValid" },
          },
        },
        {
          $addFields: {
            uniqueCount: { $size: "$uniqueFeedSignerPairs" },
          },
        },
        {
          $sort: { uniqueCount: -1, "_id.timestampMilliseconds": -1 },
        },
        {
          $limit: 1,
        },
      ]);

    if (groupedDataPackages.length === 0) {
      throw new HttpException(
        "Data packages response is empty",
        EMPTY_DATA_PACKAGE_RESPONSE_ERROR_CODE
      );
    }

    // Parse DB response
    const dataPackagesWithSameTimestamp = groupedDataPackages[0];
    for (let i = 0; i < dataPackagesWithSameTimestamp.count; i++) {
      const candidatePackage = DataPackagesService.createCachedDataPackage(
        dataPackagesWithSameTimestamp,
        dataServiceId,
        i
      );
      const dataPackageId = candidatePackage.dataPackageId!;
      DataPackagesService.updateMediumPackageInResponseIfBetter(
        fetchedPackagesPerDataFeed,
        candidatePackage
      );
      if (
        DataPackagesService.isSignerAddressAlreadyInDbResponseForDataFeed(
          candidatePackage.signerAddress,
          fetchedPackagesPerDataFeed[dataPackageId]
        )
      ) {
        continue;
      }

      if (!fetchedPackagesPerDataFeed[dataPackageId]) {
        fetchedPackagesPerDataFeed[dataPackageId] = [];
      }

      fetchedPackagesPerDataFeed[dataPackageId]!.push(candidatePackage);
    }

    return fetchedPackagesPerDataFeed;
  }

  static updateMediumPackageInResponseIfBetter(
    fetchedPackagesResponse: DataPackagesResponse,
    candidatePackage: CachedDataPackage
  ) {
    if (candidatePackage.dataPoints.length === 1) {
      return;
    }
    const mediumPackages =
      fetchedPackagesResponse[candidatePackage.dataPackageId!];
    if (!mediumPackages) {
      return;
    }
    for (let i = 0; i < mediumPackages.length; ++i) {
      if (mediumPackages[i].signerAddress === candidatePackage.signerAddress) {
        if (
          mediumPackages[i].dataPoints.length <
          candidatePackage.dataPoints.length
        ) {
          mediumPackages[i] = candidatePackage;
        }
      }
    }
  }

  static createCachedDataPackage(
    aggregate: DataPackageDocumentAggregated,
    dataServiceId: string,
    i: number
  ): CachedDataPackage {
    const dataFeedId = aggregate.dataFeedIds[i];
    const dataPackageId = aggregate.dataPackageIds[i];
    const signerAddress = aggregate.signerAddress[i];
    const dataPoints = aggregate.dataPoints[i];
    const signature = aggregate.signatures[i];
    const timestampMilliseconds = aggregate._id.timestampMilliseconds.getTime();
    const isSignatureValid = aggregate.isSignatureValid[i];
    return {
      timestampMilliseconds,
      signature,
      isSignatureValid,
      dataPoints,
      dataServiceId,
      dataFeedId,
      dataPackageId,
      signerAddress,
    };
  }

  // Filtering unique signers addresses
  static isSignerAddressAlreadyInDbResponseForDataFeed(
    signerAddress: string,
    fetchedPackagesForDataFeed: CachedDataPackage[] | undefined
  ): boolean {
    return (
      !!fetchedPackagesForDataFeed &&
      fetchedPackagesForDataFeed.some(
        (dataPackage) => dataPackage.signerAddress === signerAddress
      )
    );
  }

  static async getDataPackagesStats(
    statsRequestParams: StatsRequestParams
  ): Promise<DataPackagesStatsResponse> {
    const { fromTimestamp, toTimestamp } = statsRequestParams;

    if (toTimestamp - fromTimestamp > 7_200_000) {
      throw new BadRequestException(
        "Too big search period. Can not be bigger than 7_200_000 ms"
      );
    }

    const oraclesState = await getOracleState();
    const nodes = Object.values(oraclesState.nodes);

    const countsPerNode = await Promise.all(
      nodes.map(async (node) => {
        const count = await DataPackage.countDocuments({
          $and: [
            { timestampMilliseconds: { $gte: new Date(fromTimestamp) } },
            { timestampMilliseconds: { $lte: new Date(toTimestamp) } },
            { dataServiceId: node.dataServiceId },
            { signerAddress: node.evmAddress },
            { isSignatureValid: true },
          ],
        });
        return { node, count };
      })
    );

    const stats: DataPackagesStatsResponse = {};

    for (const countPerNode of countsPerNode) {
      stats[countPerNode.node.evmAddress] = {
        dataServiceId: countPerNode.node.dataServiceId,
        verifiedDataPackagesCount: countPerNode.count,
        nodeName: countPerNode.node.name,
      };
    }

    return stats;
  }

  static verifyRequester(body: BulkPostRequestBody) {
    return UniversalSigner.recoverSigner(
      body.dataPackages,
      body.requestSignature
    );
  }

  static async prepareReceivedDataPackagesForBulkSaving(
    receivedDataPackages: ReceivedDataPackage[],
    signerAddress: string
  ) {
    const oracleRegistryState = await getOracleState();

    const dataServiceId = getDataServiceIdForSigner(
      oracleRegistryState,
      signerAddress
    );

    const dataPackagesForSaving = receivedDataPackages.map(
      (receivedDataPackage) =>
        DataPackagesService.prepareDataPackageForSaving(
          receivedDataPackage,
          signerAddress,
          dataServiceId
        )
    );

    return dataPackagesForSaving;
  }

  private static prepareDataPackageForSaving(
    receivedDataPackage: ReceivedDataPackage,
    signerAddress: string,
    dataServiceId: string
  ) {
    const isSignatureValid = DataPackagesService.isSignatureValid(
      receivedDataPackage,
      signerAddress
    );

    const cachedDataPackage: CachedDataPackage = {
      ...receivedDataPackage,
      dataServiceId,
      signerAddress,
      isSignatureValid,
    };
    if (receivedDataPackage.dataFeedId || receivedDataPackage.dataPackageId) {
      cachedDataPackage.dataPackageId =
        receivedDataPackage.dataPackageId ?? receivedDataPackage.dataFeedId;
    } else if (receivedDataPackage.dataPoints.length === 1) {
      cachedDataPackage.dataPackageId =
        receivedDataPackage.dataPoints[0].dataFeedId;
    } else {
      cachedDataPackage.dataPackageId = consts.ALL_FEEDS_KEY;
    }
    cachedDataPackage.dataFeedId = cachedDataPackage.dataPackageId;
    return cachedDataPackage;
  }

  private static isSignatureValid(
    receivedDataPackage: ReceivedDataPackage,
    signerAddress: string
  ): boolean {
    try {
      const address = recoverDeserializedSignerAddress(receivedDataPackage);

      return address === signerAddress;
    } catch {
      return false;
    }
  }
}
