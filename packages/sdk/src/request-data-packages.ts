import { RedstoneOraclesState } from "@redstone-finance/oracles-smartweave-contracts";
import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { MathUtils, RedstoneCommon, SafeNumber } from "@redstone-finance/utils";
import axios from "axios";
import { BigNumber } from "ethers";
import _ from "lodash";
import { z } from "zod";
import { resolveDataServiceUrls } from "./data-services-urls";

const GET_REQUEST_TIMEOUT = 5_000;
const DEFAULT_WAIT_FOR_ALL_GATEWAYS_TIME = 500;
const MILLISECONDS_IN_ONE_MINUTE = 60 * 1000;

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  waitForAllGatewaysTimeMs?: number;
  maxTimestampDeviationMS?: number;
  authorizedSigners?: string[];
  dataPackagesIds: string[];
  urls?: string[];
  historicalTimestamp?: number;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: SignedDataPackage[] | undefined;
}

export interface ValuesForDataFeeds {
  [dataFeedId: string]: BigNumber | undefined;
}

const GwResponseSchema = z.record(
  z.string(),
  z.array(
    z.object({
      dataPoints: z
        .array(
          z
            .object({
              dataFeedId: z.string(),
              value: z.number(),
              decimals: z.number().optional(),
            })
            .or(
              z.object({
                dataFeedId: z.string(),
                value: z.string(),
                decimals: z.number().optional(),
              })
            )
        )
        .min(1),
      timestampMilliseconds: z.number(),
      signature: z.string(),
      dataFeedId: z.string().optional(),
      dataPackageId: z.string().optional(),
    })
  )
);
export type GwResponse = Partial<z.infer<typeof GwResponseSchema>>;

export const getDataServiceIdForSigner = (
  oracleState: RedstoneOraclesState,
  signerAddress: string
) => {
  for (const nodeDetails of Object.values(oracleState.nodes)) {
    if (nodeDetails.evmAddress.toLowerCase() === signerAddress.toLowerCase()) {
      return nodeDetails.dataServiceId;
    }
  }
  throw new Error(`Data service not found for ${signerAddress}`);
};

export const calculateHistoricalPackagesTimestamp = (
  deviationCheckOffsetInMinutes: number,
  baseTimestamp: number = Date.now()
) => {
  if (deviationCheckOffsetInMinutes > 0) {
    // We round the timestamp to full minutes for being compatible with
    // oracle-nodes, which usually work with rounded 10s and 60s intervals
    return (
      Math.floor(
        baseTimestamp / MILLISECONDS_IN_ONE_MINUTE -
          deviationCheckOffsetInMinutes
      ) * MILLISECONDS_IN_ONE_MINUTE
    );
  }
  return undefined;
};

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  if (reqParams.dataPackagesIds.length < 1) {
    throw new Error("Please provide at least one dataFeed");
  }
  try {
    const promises = prepareDataPackagePromises(reqParams);

    if (reqParams.historicalTimestamp) {
      return await Promise.any(promises);
    }

    return await getTheMostRecentDataPackages(
      promises,
      reqParams.waitForAllGatewaysTimeMs
    );
  } catch (e) {
    const errMessage = `Request failed ${JSON.stringify({
      reqParams,
    })}, Original error: ${RedstoneCommon.stringifyError(e)}`;
    throw new Error(errMessage);
  }
};

const getTheMostRecentDataPackages = (
  promises: Promise<DataPackagesResponse>[],
  waitForAllGatewaysTimeMs = DEFAULT_WAIT_FOR_ALL_GATEWAYS_TIME
): Promise<DataPackagesResponse> => {
  return new Promise((resolve, reject) => {
    const collectedResponses: DataPackagesResponse[] = [];
    const errors: Error[] = [];
    let waitForAll = true;

    const timer = setTimeout(() => {
      waitForAll = false;
      checkResults();
    }, waitForAllGatewaysTimeMs);

    const checkResults = () => {
      if (errors.length === promises.length) {
        clearTimeout(timer);
        reject(new AggregateError(errors));
      } else if (
        collectedResponses.length + errors.length === promises.length ||
        (!waitForAll && collectedResponses.length !== 0)
      ) {
        const newestPackage = collectedResponses.reduce((a, b) => {
          const aTimestamp =
            Object.values(a).at(0)?.at(0)?.dataPackage.timestampMilliseconds ??
            0;
          const bTimestamp =
            Object.values(b).at(0)?.at(0)?.dataPackage.timestampMilliseconds ??
            0;
          return bTimestamp > aTimestamp ? b : a;
        });

        clearTimeout(timer);
        resolve(newestPackage);
      }
    };

    for (const promise of promises) {
      promise
        .then((r) => collectedResponses.push(r))
        .catch((e) => errors.push(e as Error))
        .finally(checkResults);
    }
  });
};

const prepareDataPackagePromises = (
  reqParams: DataPackagesRequestParams
): Promise<DataPackagesResponse>[] => {
  if (reqParams.authorizedSigners && reqParams.authorizedSigners.length == 0) {
    throw new Error("authorizer signers array, if provided, cannot be empty");
  }
  const urls = getUrlsForDataServiceId(reqParams);
  const pathComponents = [
    "data-packages",
    reqParams.historicalTimestamp ? "historical" : "latest",
    reqParams.dataServiceId,
  ];
  if (reqParams.historicalTimestamp) {
    pathComponents.push(`${reqParams.historicalTimestamp}`);
  }

  return urls.map(async (url) => {
    const response = await sendRequestToGateway(url, pathComponents, reqParams);
    return parseAndValidateDataPackagesResponse(response.data, reqParams);
  });
};

const parseAndValidateDataPackagesResponse = (
  responseData: unknown,
  reqParams: DataPackagesRequestParams
): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};

  RedstoneCommon.zodAssert<GwResponse>(GwResponseSchema, responseData);

  const requestedDataFeedIds = reqParams.dataPackagesIds;

  for (const dataFeedId of requestedDataFeedIds) {
    let dataFeedPackages = responseData[dataFeedId];

    if (!dataFeedPackages) {
      throw new Error(
        `Requested data feed id is not included in response: ${dataFeedId}`
      );
    }

    // filter out packages with not expected signers
    if (reqParams.authorizedSigners) {
      dataFeedPackages = dataFeedPackages.filter((dp) => {
        const signer = maybeGetSigner(dp);
        if (!signer) {
          return false;
        }
        return reqParams.authorizedSigners!.includes(signer);
      });
    }

    // filter out package with deviated timestamps
    if (reqParams.maxTimestampDeviationMS) {
      const now = Date.now();
      dataFeedPackages = dataFeedPackages.filter(
        (dp) =>
          Math.abs(now - dp.timestampMilliseconds) <
          reqParams.maxTimestampDeviationMS!
      );
    }

    if (dataFeedPackages.length < reqParams.uniqueSignersCount) {
      throw new Error(
        `Too few unique signers for the data feed: ${dataFeedId}. ` +
          `Expected: ${reqParams.uniqueSignersCount}. ` +
          `Received: ${dataFeedPackages.length}`
      );
    }

    parsedResponse[dataFeedId] = pickDataFeedPackagesClosestToMedian(
      dataFeedPackages,
      reqParams.uniqueSignersCount
    );
  }

  return parsedResponse;
};

const getAllValues = (dataPackages: SignedDataPackagePlainObj[]) => {
  const allValues: Partial<Record<string, number[]>> = {};
  for (const dataPackage of dataPackages) {
    for (const dataPoint of dataPackage.dataPoints) {
      if (!allValues[dataPoint.dataFeedId]) {
        allValues[dataPoint.dataFeedId] = [];
      }
      allValues[dataPoint.dataFeedId]!.push(Number(dataPoint.value));
    }
  }
  return allValues;
};

const pickDataFeedPackagesClosestToMedian = (
  dataFeedPackages: SignedDataPackagePlainObj[],
  count: number
): SignedDataPackage[] => {
  const allValues = getAllValues(dataFeedPackages) as Record<string, number[]>;
  const allMedians = _.mapValues(allValues, MathUtils.getMedian);

  return sortByDistanceFromMedian(dataFeedPackages, allMedians)
    .map((diff) => SignedDataPackage.fromObj(diff.dp))
    .slice(0, count);
};

function sendRequestToGateway(
  url: string,
  pathComponents: string[],
  reqParams: DataPackagesRequestParams
) {
  const sanitizedUrl = [url.replace(/\/+$/, "")]
    .concat(pathComponents)
    .join("/");

  return axios.get<Record<string, SignedDataPackagePlainObj[]>>(sanitizedUrl, {
    timeout: GET_REQUEST_TIMEOUT,
    params: {
      dataFeedIds: reqParams.dataPackagesIds,
      dataPackagesIds: reqParams.dataPackagesIds,
      minimalSignersCount: reqParams.uniqueSignersCount,
    },
    paramsSerializer: { indexes: null },
  });
}

function maybeGetSigner(dp: SignedDataPackagePlainObj) {
  try {
    return SignedDataPackage.fromObj(dp).recoverSignerAddress();
  } catch {
    return undefined;
  }
}

const getMaxDistanceFromMedian = (
  dataPackage: SignedDataPackagePlainObj,
  medians: Record<string, number>
) => {
  let maxDistanceFromMedian = 0;
  for (const dataPoint of dataPackage.dataPoints) {
    maxDistanceFromMedian = Math.max(
      maxDistanceFromMedian,
      SafeNumber.createSafeNumber(dataPoint.value)
        .sub(medians[dataPoint.dataFeedId])
        .abs()
        .unsafeToNumber()
    );
  }
  return maxDistanceFromMedian;
};

function sortByDistanceFromMedian(
  dataFeedPackages: SignedDataPackagePlainObj[],
  medians: Record<string, number>
) {
  return dataFeedPackages
    .map((dp) => ({
      dp: dp,
      diff: getMaxDistanceFromMedian(dp, medians),
    }))
    .sort((first, second) => first.diff - second.diff);
}

const getUrlsForDataServiceId = (
  reqParams: DataPackagesRequestParams
): string[] => {
  if (reqParams.urls) {
    return reqParams.urls;
  }
  return resolveDataServiceUrls(reqParams.dataServiceId);
};
