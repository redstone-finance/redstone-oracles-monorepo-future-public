import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  RedstonePayload,
  UniversalSigner,
  consts,
  recoverDeserializedSignerAddress,
} from "@redstone-finance/protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  parseDataPackagesResponse,
} from "@redstone-finance/sdk";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
  ReceivedDataPackage,
} from "./data-packages.interface";
import {
  CachedDataPackage,
  DataPackage,
  DataPackageDocument,
  DataPackageDocumentAggregated,
} from "./data-packages.model";
import { makePayload } from "../utils/make-redstone-payload";
import { getOracleState } from "../utils/get-oracle-state";
import { BundlrService } from "../bundlr/bundlr.service";
import { runPromiseWithLogging } from "../utils/utils";
import { RedstoneCommon } from "@redstone-finance/utils";

export interface StatsRequestParams {
  fromTimestamp: number;
  toTimestamp: number;
}

@Injectable()
export class DataPackagesService {
  private readonly logger = new Logger(DataPackagesService.name);

  constructor(private readonly bundlrService: BundlrService) {}

  /**  Save dataPackages to DB and bundlr if enabled */
  async saveMany(
    dataPackagesToSave: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const savePromises: Promise<unknown>[] = [];
    const saveToDbPromise = runPromiseWithLogging(
      this.saveManyDataPackagesInDB(dataPackagesToSave),
      `Save ${dataPackagesToSave.length} data packages for node ${nodeEvmAddress} to Database`,
      this.logger
    );
    savePromises.push(saveToDbPromise);

    if (config.enableArchivingOnArweave) {
      const saveToBundlrPromise = runPromiseWithLogging(
        this.bundlrService.saveDataPackages(dataPackagesToSave),
        `Save ${dataPackagesToSave.length} data packages for node ${nodeEvmAddress} to Bundlr`,
        this.logger
      );
      savePromises.push(saveToBundlrPromise);
    }

    await Promise.allSettled(savePromises);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async saveManyDataPackagesInDB(dataPackages: CachedDataPackage[]) {
    await DataPackage.insertMany(dataPackages);
  }

  getLatestDataPackagesWithSameTimestampWithCache = RedstoneCommon.memoize({
    functionToMemoize: (dataServiceId: string) =>
      this.getLatestDataPackagesWithSameTimestamp(dataServiceId),
    ttl: config.dataPackagesTTL,
  });

  getMostRecentDataPackagesWithCache = RedstoneCommon.memoize({
    functionToMemoize: (dataServiceId: string) =>
      DataPackagesService.getMostRecentDataPackagesFromDB(dataServiceId),
    ttl: config.dataPackagesTTL,
  });

  static async getByTimestamp(
    dataServiceId: string,
    timestamp: number
  ): Promise<DataPackagesResponse> {
    return await DataPackagesService.getMostRecentDataPackagesFromDB(
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
  static async getMostRecentDataPackagesFromDB(
    dataServiceId: string,
    timestamp?: number
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: DataPackagesResponse = {};

    const groupedDataPackages =
      await DataPackage.aggregate<DataPackageDocument>([
        {
          $match: {
            dataServiceId,
            timestampMilliseconds: timestamp ?? {
              $gte: Date.now() - config.maxAllowedTimestampDelay,
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
            isSignatureValid: { $first: "$isSignatureValid" },
          },
        },
        {
          $sort: { timestampMilliseconds: -1 },
        },
      ]);

    // Parse DB response
    for (const dataPackage of groupedDataPackages) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { _id, __v, ...rest } = dataPackage;
      const dataFeedId = _id!.dataFeedId;
      if (!fetchedPackagesPerDataFeed[dataFeedId]) {
        fetchedPackagesPerDataFeed[dataFeedId] = [];
      }

      fetchedPackagesPerDataFeed[dataFeedId]!.push({
        ...rest,
        dataFeedId,
        signerAddress: _id!.signerAddress,
      });
    }

    return fetchedPackagesPerDataFeed;
  }

  /**
   * All packages will share common timestamp
   *  */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getLatestDataPackagesWithSameTimestamp(
    dataServiceId: string
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[] | undefined;
    } = {};

    const groupedDataPackages =
      await DataPackage.aggregate<DataPackageDocumentAggregated>([
        {
          $match: {
            dataServiceId,
            timestampMilliseconds: {
              $gte: Date.now() - config.maxAllowedTimestampDelay,
            },
          },
        },
        {
          $group: {
            _id: {
              timestampMilliseconds: "$timestampMilliseconds",
            },
            count: { $count: {} },
            signatures: { $push: "$signature" },
            dataPoints: { $push: "$dataPoints" },
            dataFeedIds: { $push: "$dataFeedId" },
            signerAddress: { $push: "$signerAddress" },
            isSignatureValid: { $push: "$isSignatureValid" },
          },
        },
        {
          $sort: { count: -1, "_id.timestampMilliseconds": -1 },
        },
        {
          $limit: 1,
        },
      ]);

    if (groupedDataPackages.length === 0) {
      return fetchedPackagesPerDataFeed;
    }
    // Parse DB response
    const dataPackagesWithSameTimestamp = groupedDataPackages[0];
    for (let i = 0; i < dataPackagesWithSameTimestamp.count; i++) {
      const dataFeedId = dataPackagesWithSameTimestamp.dataFeedIds[i];
      const signerAddress = dataPackagesWithSameTimestamp.signerAddress[i];
      if (
        DataPackagesService.isSignerAddressAlreadyInDbResponseForDataFeed(
          signerAddress,
          fetchedPackagesPerDataFeed[dataFeedId]
        )
      ) {
        continue;
      }
      const dataPoints = dataPackagesWithSameTimestamp.dataPoints[i];
      const signature = dataPackagesWithSameTimestamp.signatures[i];
      const timestampMilliseconds =
        dataPackagesWithSameTimestamp._id.timestampMilliseconds;
      const isSignatureValid =
        dataPackagesWithSameTimestamp.isSignatureValid[i];

      if (!fetchedPackagesPerDataFeed[dataFeedId]) {
        fetchedPackagesPerDataFeed[dataFeedId] = [];
      }

      fetchedPackagesPerDataFeed[dataFeedId]!.push({
        timestampMilliseconds,
        signature,
        isSignatureValid,
        dataPoints,
        dataServiceId,
        dataFeedId,
        signerAddress,
      });
    }

    return fetchedPackagesPerDataFeed;
  }

  // Filtering unique signers addresses
  static isSignerAddressAlreadyInDbResponseForDataFeed(
    signerAddress: string,
    fetchedPackagesForDataFeed: CachedDataPackage[] | undefined
  ) {
    return fetchedPackagesForDataFeed?.some((dataPackage) =>
      Object.values(dataPackage).includes(signerAddress)
    );
  }

  async queryLatestDataPackages(requestParams: DataPackagesRequestParams) {
    const cachedDataPackagesResponse =
      await this.getLatestDataPackagesWithSameTimestampWithCache(
        requestParams.dataServiceId
      );

    return parseDataPackagesResponse(cachedDataPackagesResponse, requestParams);
  }

  async getPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<RedstonePayload> {
    const cachedDataPackagesResponse =
      await this.getMostRecentDataPackagesWithCache(
        requestParams.dataServiceId
      );

    const dataPackages = parseDataPackagesResponse(
      cachedDataPackagesResponse,
      requestParams
    );

    return makePayload(dataPackages);
  }

  static async getDataPackagesStats(
    statsRequestParams: StatsRequestParams
  ): Promise<DataPackagesStatsResponse> {
    const { fromTimestamp, toTimestamp } = statsRequestParams;

    if (toTimestamp - fromTimestamp > 7_200_000) {
      throw new BadRequestException(
        "Too big search period. Can not be bigger than 7_200_000"
      );
    }

    const oraclesState = await getOracleState();
    const nodes = Object.values(oraclesState.nodes);

    const countsPerNode = await Promise.all(
      nodes.map(async (node) => {
        const count = await DataPackage.countDocuments({
          $and: [
            { timestampMilliseconds: { $gte: fromTimestamp } },
            { timestampMilliseconds: { $lte: toTimestamp } },
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
    if (receivedDataPackage.dataPoints.length === 1) {
      cachedDataPackage.dataFeedId =
        receivedDataPackage.dataPoints[0].dataFeedId;
    } else {
      cachedDataPackage.dataFeedId = consts.ALL_FEEDS_KEY;
    }
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
