import { Injectable } from "@nestjs/common";
import { RedstonePayload, UniversalSigner } from "redstone-protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  getOracleRegistryState,
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

  // TODO: try to replace current implementation using only one aggregation call
  async getDataPackages(
    requestConfig: DataPackagesRequestParams
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[];
    } = {};

    const getDataPackagesForDataFeed = async (dataFeedId: string) => {
      const groupedDataPackages = await DataPackage.aggregate([
        {
          $match: {
            dataServiceId: requestConfig.dataServiceId,
            dataFeedId,
          },
        },
        {
          $group: {
            _id: "$signerAddress",
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
        {
          $limit: Number(requestConfig.uniqueSignersCount),
        },
      ]);

      const dataPackages = groupedDataPackages.map((dp) => {
        const { _id, __v, ...rest } = dp;
        _id;
        __v;
        return {
          ...rest,
          signerAddress: _id,
        };
      });

      fetchedPackagesPerDataFeed[dataFeedId] = dataPackages;
    };

    // Fetching data packages for each data feed
    if (!!requestConfig.dataFeeds) {
      const promises = requestConfig.dataFeeds.map(getDataPackagesForDataFeed);
      await Promise.all(promises);
    } else {
      await getDataPackagesForDataFeed(ALL_FEEDS_KEY);
    }

    return fetchedPackagesPerDataFeed;
  }

  async getPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<RedstonePayload> {
    const cachedDataPackagesResponse = await this.getDataPackages(
      requestParams
    );

    return makePayload(cachedDataPackagesResponse);
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
        },
      },
    ]);

    // Prepare stats response
    const state = await getOracleRegistryState();
    const stats: DataPackagesStatsResponse = {};
    for (const { dataPackagesCount, _id: signerAddress } of signersStats) {
      const nodeDetails = Object.values(state.nodes).find(
        ({ evmAddress }) => evmAddress === signerAddress
      );

      stats[signerAddress] = {
        dataPackagesCount,
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
        const cachedDataPackage: CachedDataPackage = {
          ...receivedDataPackage,
          dataServiceId,
          signerAddress,
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
}
