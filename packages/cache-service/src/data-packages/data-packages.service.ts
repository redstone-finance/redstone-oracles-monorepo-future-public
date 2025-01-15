import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import { filterOutliers } from "@redstone-finance/internal-utils";
import {
  UniversalSigner,
  recoverDeserializedSignerAddress,
} from "@redstone-finance/protocol";
import {
  EXTERNAL_SIGNERS_CUTOFF_DATE,
  getDataServiceIdForSigner,
} from "@redstone-finance/sdk";
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
export class DataPackagesService implements OnModuleInit {
  private readonly logger = new Logger(DataPackagesService.name);
  private readonly broadcasters: DataPackagesBroadcaster[] = [];
  private static allowedSigners: string[] | null = null;

  constructor(
    @Optional() mongoBroadcaster?: MongoBroadcaster,
    @Optional() streamrBroadcaster?: StreamrBroadcaster
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

  async onModuleInit() {
    await this.initializeAllowedSigners();
  }

  private async initializeAllowedSigners() {
    const oracleRegistryState = await getOracleState();
    DataPackagesService.allowedSigners = Object.values(
      oracleRegistryState.nodes
    )
      .filter(
        (node) =>
          new Date(node.dateAdded).getTime() < EXTERNAL_SIGNERS_CUTOFF_DATE
      )
      .map((node) => node.evmAddress);
  }

  private static getAllowedSigners(): string[] {
    if (DataPackagesService.allowedSigners === null) {
      throw new Error("AllowedSigners not initialized");
    }
    return DataPackagesService.allowedSigners;
  }

  /**  Save dataPackages to DB and streamr (optionally) */
  async broadcast(
    dataPackagesToSave: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void[]> {
    const packagesTimestamp = dataPackagesToSave[0]?.timestampMilliseconds;
    const message = `broadcast ${dataPackagesToSave.length} data packages for node ${nodeEvmAddress} and timestamp ${packagesTimestamp}`;
    const savePromises = this.broadcasters.map(async (broadcaster) => {
      try {
        await broadcaster.broadcast(dataPackagesToSave, nodeEvmAddress);
        this.logger.log(
          `[${broadcaster.constructor.name}] succeeded to ${message}.`
        );
      } catch (error) {
        this.logger.error(
          `[${
            broadcaster.constructor.name
          }] failed to ${message}. ${RedstoneCommon.stringifyError(error)}`
        );
        throw error;
      }
    });

    return await Promise.all(savePromises);
  }

  getLatestDataPackagesWithSameTimestampWithCache = RedstoneCommon.memoize({
    functionToMemoize: async (
      dataServiceId: string,
      hideMetadata?: boolean,
      allowExternalSigners?: boolean
    ) =>
      await this.getLatestDataPackagesFromDbWithSameTimestamp(
        dataServiceId,
        hideMetadata,
        allowExternalSigners
      ),
    ttl: config.dataPackagesTTL,
  });

  getLatestDataPackagesWithCache = RedstoneCommon.memoize({
    functionToMemoize: async (
      dataServiceId: string,
      hideMetadata?: boolean,
      allowExternalSigners?: boolean
    ) =>
      await DataPackagesService.getDataPackagesFromDbByTimestampOrLatest(
        dataServiceId,
        undefined,
        hideMetadata,
        allowExternalSigners
      ),
    ttl: config.dataPackagesTTL,
  });

  static async getDataPackagesByTimestamp(
    dataServiceId: string,
    timestamp: number,
    hideMetadata?: boolean,
    allowExternalSigners?: boolean
  ): Promise<DataPackagesResponse> {
    return await DataPackagesService.getDataPackagesFromDbByTimestampOrLatest(
      dataServiceId,
      timestamp,
      hideMetadata,
      allowExternalSigners
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
    timestamp?: number,
    hideMetadata: boolean = false,
    allowExternalSigners: boolean = false
  ): Promise<DataPackagesResponse> {
    let fetchedPackagesPerDataFeed: DataPackagesResponse = {};

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
              dataPackageId: "$dataPackageId",
            },
            timestampMilliseconds: { $first: "$timestampMilliseconds" },
            signature: { $first: "$signature" },
            dataPoints: { $first: "$dataPoints" },
            dataServiceId: { $first: "$dataServiceId" },
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
      const { _id, ...rest } = dataPackage;
      const dataPackageId = _id.dataPackageId;
      if (!fetchedPackagesPerDataFeed[dataPackageId]) {
        fetchedPackagesPerDataFeed[dataPackageId] = [];
      }

      fetchedPackagesPerDataFeed[dataPackageId].push({
        ...rest,
        timestampMilliseconds: rest.timestampMilliseconds.getTime(),
        signerAddress: _id.signerAddress,
      });
      // temporary for backward compatibility
      (
        fetchedPackagesPerDataFeed[dataPackageId].at(-1) as unknown as {
          dataFeedId: string;
        }
      ).dataFeedId = dataPackageId;
    }

    fetchedPackagesPerDataFeed = DataPackagesService.filterOutExternalSigners(
      fetchedPackagesPerDataFeed,
      allowExternalSigners
    );

    if (Object.keys(fetchedPackagesPerDataFeed).length === 0) {
      throw new HttpException(
        "Data packages response is empty",
        EMPTY_DATA_PACKAGE_RESPONSE_ERROR_CODE
      );
    }

    let fetchedPackages = fetchedPackagesPerDataFeed;
    if (hideMetadata) {
      fetchedPackages = DataPackagesService.filterMetadataFromDataPackages(
        fetchedPackagesPerDataFeed
      );
    }

    return filterOutliers(fetchedPackages);
  }

  /**
   * All packages will share common timestamp
   *  */
  async getLatestDataPackagesFromDbWithSameTimestamp(
    dataServiceId: string,
    hideMetadata: boolean = false,
    allowExternalSigners: boolean = false
  ): Promise<DataPackagesResponse> {
    let fetchedPackagesPerDataFeed: DataPackagesResponse = {};

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
                dataPackageId: "$dataPackageId",
                signerAddress: "$signerAddress",
              },
            },
            count: { $count: {} },
            signatures: { $push: "$signature" },
            dataPoints: { $push: "$dataPoints" },
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
      const dataPackageId = candidatePackage.dataPackageId;
      // temporary for backward compatibility
      (candidatePackage as unknown as { dataFeedId: string }).dataFeedId =
        dataPackageId;
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

      fetchedPackagesPerDataFeed[dataPackageId].push(candidatePackage);
    }

    fetchedPackagesPerDataFeed = DataPackagesService.filterOutExternalSigners(
      fetchedPackagesPerDataFeed,
      allowExternalSigners
    );

    if (Object.keys(fetchedPackagesPerDataFeed).length === 0) {
      throw new HttpException(
        "Data packages response is empty",
        EMPTY_DATA_PACKAGE_RESPONSE_ERROR_CODE
      );
    }

    let fetchedPackages = fetchedPackagesPerDataFeed;
    if (hideMetadata) {
      fetchedPackages = DataPackagesService.filterMetadataFromDataPackages(
        fetchedPackagesPerDataFeed
      );
    }

    return filterOutliers(fetchedPackages);
  }

  static updateMediumPackageInResponseIfBetter(
    fetchedPackagesResponse: DataPackagesResponse,
    candidatePackage: CachedDataPackage
  ) {
    if (candidatePackage.dataPoints.length === 1) {
      return;
    }
    const mediumPackages =
      fetchedPackagesResponse[candidatePackage.dataPackageId];
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

  private static filterMetadataFromDataPackages(
    response: DataPackagesResponse
  ): DataPackagesResponse {
    const filtered: DataPackagesResponse = {};

    for (const [key, packages] of Object.entries(response)) {
      if (!packages) continue;

      filtered[key] = packages.map((pkg) => ({
        ...pkg,
        dataPoints: pkg.dataPoints.map((point) => ({
          ...point,
          metadata: undefined,
        })),
      }));
    }

    return filtered;
  }

  private static filterOutExternalSigners(
    dataPackages: DataPackagesResponse,
    allowExternalSigners: boolean
  ): DataPackagesResponse {
    if (allowExternalSigners) {
      return dataPackages;
    }

    const allowedSigners = this.getAllowedSigners();
    const filtered: DataPackagesResponse = {};

    for (const [key, packages] of Object.entries(dataPackages)) {
      if (!packages) continue;

      const filteredPackages = packages.filter((pkg) => {
        return allowedSigners
          .map((x) => x.toLowerCase())
          .includes(pkg.signerAddress.toLowerCase());
      });

      if (filteredPackages.length > 0) {
        filtered[key] = filteredPackages;
      }
    }

    return filtered;
  }
}
