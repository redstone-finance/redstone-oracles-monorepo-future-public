import { Injectable } from "@nestjs/common";
import {
  computeAddress,
  keccak256,
  recoverPublicKey,
  toUtf8Bytes,
} from "ethers/lib/utils";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  getOracleRegistryState,
} from "redstone-sdk";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
} from "./data-packages.controller";
import { ReceivedDataPackage } from "./data-packages.interface";
import { CachedDataPackage, DataPackage } from "./data-packages.model";

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
          $sort: { signerAddress: 1, timestampMilliseconds: -1 },
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
          $limit: Number(requestConfig.uniqueSignersCount),
        },
      ]);

      fetchedPackagesPerDataFeed[dataFeedId] = groupedDataPackages.map((dp) => {
        const { _id, __v, ...rest } = dp;
        return {
          ...rest,
          signerAddress: _id,
        };
      });
    };

    // Fetching data packages for each data feed
    const promises = requestConfig.dataFeeds.map(getDataPackagesForDataFeed);
    await Promise.all(promises);

    return fetchedPackagesPerDataFeed;
  }

  async verifyRequester(body: BulkPostRequestBody) {
    const signerAddress = this.recoverSigner(
      JSON.stringify(body.dataPackages),
      body.requestSignature
    );

    return signerAddress;
  }

  // TODO: maybe move this logic to a shared module (e.g. redstone-sdk)
  // Maybe use personal sign instead
  recoverSigner(message: string, signature: string): string {
    const digest = keccak256(toUtf8Bytes(message));
    const publicKey = recoverPublicKey(digest, signature);
    return computeAddress(publicKey);
  }

  async prepareReceivedDataPackagesForBulkSaving(
    receivedDataPackages: ReceivedDataPackage[],
    signerAddress: string
  ) {
    const oracleRegistryState = await getOracleRegistryState();
    const dataServiceId = getDataServiceIdForSigner(
      oracleRegistryState,
      signerAddress
    );

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
        }
        return cachedDataPackage;
      }
    );

    return dataPackagesForSaving;
  }
}
