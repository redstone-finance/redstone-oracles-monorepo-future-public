import { Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";
import {
  RedstonePayload,
  UniversalSigner,
  recoverDeserializedSignerAddress,
} from "redstone-protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  parseDataPackagesResponse,
} from "redstone-sdk";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
  ReceivedDataPackage,
} from "./data-packages.interface";
import { CachedDataPackage, DataPackage } from "./data-packages.model";
import { makePayload } from "../utils/make-redstone-payload";
import { getOracleState } from "../utils/get-oracle-state";
import { BundlrService } from "../bundlr/bundlr.service";
import { runPromiseWithLogging } from "../utils/utils";

// Cache TTL can slightly increase the data delay, but having efficient
// caching is crucial for the app performance. Assuming, that we have 10s
// update frequency in nodes, 5s cache TTL on the app level, and 5s cache TTL
// on the CDN level - then the max data delay is ~20s, which is still good enough :)
const CACHE_TTL = 5000;
const MAX_ALLOWED_TIMESTAMP_DELAY = 180 * 1000; // 3 minutes in milliseconds
export const ALL_FEEDS_KEY = "___ALL_FEEDS___";

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
    const savePromises: Promise<any>[] = [];
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

  async saveManyDataPackagesInDB(dataPackages: CachedDataPackage[]) {
    await DataPackage.insertMany(dataPackages);
  }

  async getLatestDataPackagesWithSameTimestampWithCache(
    dataServiceId: string,
    cacheManager: Cache
  ): Promise<DataPackagesResponse> {
    const cacheKey = `data-packages/latest/${dataServiceId}`;
    const dataPackagesFromCache = await cacheManager.get<DataPackagesResponse>(
      cacheKey
    );

    if (!dataPackagesFromCache) {
      const dataPackages = await this.getLatestDataPackagesWithSameTimestamp(
        dataServiceId
      );
      await cacheManager.set(cacheKey, dataPackages, CACHE_TTL);
      return dataPackages;
    } else {
      return dataPackagesFromCache;
    }
  }

  async getMostRecentDataPackagesWithCache(
    dataServiceId: string,
    cacheManager: Cache
  ): Promise<DataPackagesResponse> {
    const cacheKey = `data-packages/latest-not-aligned-by-time/${dataServiceId}`;
    const dataPackagesFromCache = await cacheManager.get<DataPackagesResponse>(
      cacheKey
    );

    if (!dataPackagesFromCache) {
      const dataPackages = await this.getMostRecentDataPackagesFromDB(
        dataServiceId
      );
      await cacheManager.set(cacheKey, dataPackages, CACHE_TTL);
      return dataPackages;
    } else {
      return dataPackagesFromCache;
    }
  }
  async getByTimestamp(
    dataServiceId: string,
    timestamp: number
  ): Promise<DataPackagesResponse> {
    return await this.getMostRecentDataPackagesFromDB(dataServiceId, timestamp);
  }

  async isDataServiceIdValid(dataServiceId: string): Promise<boolean> {
    const oracleRegistryState = await getOracleState();
    return !!oracleRegistryState.dataServices[dataServiceId];
  }

  /**
   * Packages might have different timestamps if timestamp not passed
   * */
  async getMostRecentDataPackagesFromDB(
    dataServiceId: string,
    timestamp?: number
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[];
    } = {};

    const groupedDataPackages = await DataPackage.aggregate([
      {
        $match: {
          dataServiceId,
          timestampMilliseconds: timestamp ?? {
            $gte: Date.now() - MAX_ALLOWED_TIMESTAMP_DELAY,
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
      const { _id, __v, ...rest } = dataPackage;
      __v;
      const dataFeedId = _id.dataFeedId;
      if (!fetchedPackagesPerDataFeed[dataFeedId]) {
        fetchedPackagesPerDataFeed[dataFeedId] = [];
      }

      fetchedPackagesPerDataFeed[dataFeedId].push({
        ...rest,
        dataFeedId,
        signerAddress: _id.signerAddress,
      });
    }

    return fetchedPackagesPerDataFeed;
  }

  /**
   * All packages will share common timestamp
   *  */
  async getLatestDataPackagesWithSameTimestamp(
    dataServiceId: string
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[];
    } = {};

    const groupedDataPackages = await DataPackage.aggregate([
      {
        $match: {
          dataServiceId,
          timestampMilliseconds: {
            $gte: Date.now() - MAX_ALLOWED_TIMESTAMP_DELAY,
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

      fetchedPackagesPerDataFeed[dataFeedId].push({
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
    fetchedPackagesForDataFeed: CachedDataPackage[]
  ) {
    return fetchedPackagesForDataFeed?.some((dataPackage) =>
      Object.values(dataPackage).includes(signerAddress)
    );
  }

  async queryLatestDataPackages(
    requestParams: DataPackagesRequestParams,
    cacheManager: Cache
  ) {
    const cachedDataPackagesResponse =
      await this.getLatestDataPackagesWithSameTimestampWithCache(
        requestParams.dataServiceId,
        cacheManager
      );

    return parseDataPackagesResponse(cachedDataPackagesResponse, requestParams);
  }

  async getPayload(
    requestParams: DataPackagesRequestParams,
    cacheManager: Cache
  ): Promise<RedstonePayload> {
    const cachedDataPackagesResponse =
      await this.getMostRecentDataPackagesWithCache(
        requestParams.dataServiceId,
        cacheManager
      );

    const dataPackages = parseDataPackagesResponse(
      cachedDataPackagesResponse,
      requestParams
    );

    return makePayload(dataPackages);
  }

  async getDataPackagesStats(
    statsRequestParams: StatsRequestParams
  ): Promise<DataPackagesStatsResponse> {
    const { fromTimestamp, toTimestamp } = statsRequestParams;

    // Fetching stats form DB
    const signersStats = await DataPackage.aggregate([
      {
        $match: {
          $and: [
            { timestampMilliseconds: { $gte: fromTimestamp } },
            { timestampMilliseconds: { $lte: toTimestamp } },
          ],
        },
      },
      {
        $group: {
          _id: "$signerAddress",
          dataPackagesCount: { $sum: 1 },
          verifiedDataPackagesCount: {
            $sum: { $cond: ["$isSignatureValid", 1, 0] },
          },
        },
      },
    ]);

    // Prepare stats response
    const state = await getOracleState();
    const stats: DataPackagesStatsResponse = {};
    for (const {
      dataPackagesCount,
      verifiedDataPackagesCount,
      _id: signerAddress,
    } of signersStats) {
      const nodeDetails = Object.values(state.nodes).find(
        ({ evmAddress }) => evmAddress === signerAddress
      );

      const verifiedDataPackagesPercentage =
        (100 * verifiedDataPackagesCount) / Math.max(dataPackagesCount, 1);

      stats[signerAddress] = {
        dataPackagesCount,
        verifiedDataPackagesCount,
        verifiedDataPackagesPercentage,
        nodeName: nodeDetails?.name || "unknown",
        dataServiceId: nodeDetails?.dataServiceId || "unknown",
      };
    }

    return stats;
  }

  verifyRequester(body: BulkPostRequestBody) {
    return UniversalSigner.recoverSigner(
      body.dataPackages,
      body.requestSignature
    );
  }

  async prepareReceivedDataPackagesForBulkSaving(
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
        this.prepareDataPackageForSaving(
          receivedDataPackage,
          signerAddress,
          dataServiceId
        )
    );

    return dataPackagesForSaving;
  }

  private prepareDataPackageForSaving(
    receivedDataPackage: ReceivedDataPackage,
    signerAddress: string,
    dataServiceId: string
  ) {
    const isSignatureValid = this.isSignatureValid(
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
      cachedDataPackage.dataFeedId = ALL_FEEDS_KEY;
    }
    return cachedDataPackage;
  }

  private isSignatureValid(
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
