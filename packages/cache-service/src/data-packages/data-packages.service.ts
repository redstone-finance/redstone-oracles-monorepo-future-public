import { Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import {
  RedstonePayload,
  UniversalSigner,
  recoverDeserializedSignerAddress,
} from "redstone-protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  getOracleRegistryState,
  parseDataPackagesResponse,
} from "redstone-sdk";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
} from "./data-packages.controller";
import { ReceivedDataPackage } from "./data-packages.interface";
import { CachedDataPackage, DataPackage } from "./data-packages.model";
import { makePayload } from "../utils/make-redstone-payload";

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
  async saveManyDataPackagesInDB(dataPackages: CachedDataPackage[]) {
    await DataPackage.insertMany(dataPackages);
  }

  async getAllLatestDataWithCache(
    dataServiceId: string,
    cacheManager: Cache
  ): Promise<DataPackagesResponse> {
    // Checking if data packages for this data service are
    // presented in the application memory cache
    const cacheKey = `data-packages/latest/${dataServiceId}`;
    const dataPackagesFromCache = await cacheManager.get<DataPackagesResponse>(
      cacheKey
    );

    if (!dataPackagesFromCache) {
      const dataPackages = await this.getAllLatestDataPackagesFromDB(
        dataServiceId
      );
      await cacheManager.set(cacheKey, dataPackages, CACHE_TTL);
      return dataPackages;
    } else {
      return dataPackagesFromCache;
    }
  }

  async isDataServiceIdValid(dataServiceId: string): Promise<boolean> {
    const oracleRegistryState = await getOracleRegistryState();
    return !!oracleRegistryState.dataServices[dataServiceId];
  }

  async getAllLatestDataPackagesFromDB(
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
            signerAddress: "$signerAddress",
            dataFeedId: "$dataFeedId",
          },
          timestampMilliseconds: { $first: "$timestampMilliseconds" },
          signature: { $first: "$signature" },
          dataPoints: { $first: "$dataPoints" },
          dataServiceId: { $first: "$dataServiceId" },
          dataFeedId: { $first: "$dataFeedId" },
          sources: { $first: "$sources" },
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

  async getDataPackages(
    requestParams: DataPackagesRequestParams,
    cacheManager: Cache
  ) {
    const cachedDataPackagesResponse = await this.getAllLatestDataWithCache(
      requestParams.dataServiceId,
      cacheManager
    );

    return parseDataPackagesResponse(cachedDataPackagesResponse, requestParams);
  }

  async getPayload(
    requestParams: DataPackagesRequestParams,
    cacheManager: Cache
  ): Promise<RedstonePayload> {
    const dataPackages = await this.getDataPackages(
      requestParams,
      cacheManager
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
    const state = await getOracleRegistryState();
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
    const oracleRegistryState = await getOracleRegistryState();

    const dataServiceId = config.mockDataServiceIdForPackages
      ? "mock-data-service-1"
      : getDataServiceIdForSigner(oracleRegistryState, signerAddress);

    const dataPackagesForSaving = receivedDataPackages.map(
      (receivedDataPackage) => {
        const isSignatureValid = this.isSignatureValid(
          receivedDataPackage,
          signerAddress
        );

        const cachedDataPackage: CachedDataPackage = {
          ...receivedDataPackage,
          dataServiceId,
          signerAddress,
          isSignatureValid: isSignatureValid,
        };
        if (receivedDataPackage.dataPoints.length === 1) {
          cachedDataPackage.dataFeedId =
            receivedDataPackage.dataPoints[0].dataFeedId;
        } else {
          cachedDataPackage.dataFeedId = ALL_FEEDS_KEY;
        }
        return cachedDataPackage;
      }
    );

    return dataPackagesForSaving;
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
