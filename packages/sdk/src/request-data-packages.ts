import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";
import { BigNumber } from "ethers";
import { z } from "zod";
import { resolveDataServiceUrls } from "./data-services-urls";
import { pickDataFeedPackagesClosestToMedian } from "./pick-closest-to-median";
import { RequestDataPackagesLogger } from "./RequestDataPackagesLogger";

const GET_REQUEST_TIMEOUT = 5_000;
const DEFAULT_WAIT_FOR_ALL_GATEWAYS_TIME = 500;
export const HISTORICAL_DATA_PACKAGES_DENOMINATOR_MS = 10000;

/**
 * defines behavior of {@link requestDataPackages} method
 */
export interface DataPackagesRequestParams {
  /**
   * for production environment most of the time "redstone-primary-prod" is appropriate
   */
  dataServiceId: string;
  /**
   * array of tokens to fetch
   */
  dataPackagesIds: string[];
  /**
   * ensure minimum number of signers for each token
   * - 'uniqueSignersCount' packages closest to median of all fetched packages are returned (value 2 is recommended for prod nodes)
   * - throws if there are less signers for any token
   */
  uniqueSignersCount: number;
  /**
   * wait for responses from all the gateways for this time, then wait for at least one response and return the newest fetched packages (does not apply if 'historicalTimestamp' is provided)
   */
  waitForAllGatewaysTimeMs?: number;
  /**
   * maximum allowed timestamp deviation in milliseconds
   */
  maxTimestampDeviationMS?: number;
  /**
   * accept packages only from specific signers, by default do not filter by signers
   */
  authorizedSigners?: string[];
  /**
   * fetch from specific gateways, if not provided fetch from all publicly available gateways
   */
  urls?: string[];
  /**
   * fetch packages from specific moment (unix timestamp in milliseconds), most of the time this value should be multiple of 10000 (10 sec)
   * in this mode first response is returned to the user
   */
  historicalTimestamp?: number;
  /**
   * do not throw error in case of missing or filtered-out token
   */
  ignoreMissingFeed?: boolean;
  /**
   * adds more detailed logs, depending on the log level
   */
  enableEnhancedLogs?: boolean;
  /**
   * By default, packages closest to the median are returned. Setting this to true causes all packages to be returned.
   */
  disableMedianSelection?: boolean;
}

/**
 * represents per-feed response from DDL
 */
export interface DataPackagesResponse {
  [dataPackageId: string]: SignedDataPackage[] | undefined;
}

export interface ValuesForDataFeeds {
  [dataFeedId: string]: BigNumber | undefined;
}

export const SignedDataPackageSchema = z.object({
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
  dataPackageId: z.string(),
});

const GwResponseSchema = z.record(z.string(), z.array(SignedDataPackageSchema));
export type GwResponse = Partial<z.infer<typeof GwResponseSchema>>;

export const calculateHistoricalPackagesTimestamp = (
  deviationCheckOffsetInMilliseconds: number,
  baseTimestamp: number = Date.now(),
  denominator = HISTORICAL_DATA_PACKAGES_DENOMINATOR_MS
) => {
  if (deviationCheckOffsetInMilliseconds > 0) {
    // We round the timestamp to full 10s, which usually works, better solution will be to have this rounding mechanism implemented in oracle-gateways
    return (
      Math.floor(
        (baseTimestamp - deviationCheckOffsetInMilliseconds) / denominator
      ) * denominator
    );
  }
  return undefined;
};

/**
 * fetch data packages from RedStone DDL
 * @param {DataPackagesRequestParams} reqParams fetch config
 */
export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  if (reqParams.dataPackagesIds.length < 1) {
    throw new Error("Please provide at least one dataFeed");
  }
  try {
    const urls = getUrlsForDataServiceId(reqParams);
    const requestDataPackagesLogger = reqParams.enableEnhancedLogs
      ? new RequestDataPackagesLogger(urls.length)
      : undefined;
    const promises = prepareDataPackagePromises(
      reqParams,
      urls,
      requestDataPackagesLogger
    );

    if (reqParams.historicalTimestamp) {
      return await Promise.any(promises);
    }

    return await getTheMostRecentDataPackages(
      promises,
      reqParams.waitForAllGatewaysTimeMs,
      requestDataPackagesLogger
    );
  } catch (e) {
    const errMessage = `Request failed: ${JSON.stringify({
      reqParams,
    })}, Original error: ${RedstoneCommon.stringifyError(e)}`;
    throw new Error(errMessage);
  }
};

export const getResponseTimestamp = (response: DataPackagesResponse) =>
  Object.values(response).at(0)?.at(0)?.dataPackage.timestampMilliseconds ?? 0;

const getTheMostRecentDataPackages = (
  promises: Promise<DataPackagesResponse>[],
  waitForAllGatewaysTimeMs = DEFAULT_WAIT_FOR_ALL_GATEWAYS_TIME,
  requestDataPackagesLogger?: RequestDataPackagesLogger
): Promise<DataPackagesResponse> => {
  return new Promise((resolve, reject) => {
    const collectedResponses: DataPackagesResponse[] = [];
    const collectedErrors: Error[] = [];

    let isTimedOut = false;
    let didResolveOrReject = false;

    const timer = setTimeout(() => {
      isTimedOut = true;
      checkResults(true);
    }, waitForAllGatewaysTimeMs);

    const checkResults = (timeout = false) => {
      requestDataPackagesLogger?.willCheckState(timeout, didResolveOrReject);

      if (didResolveOrReject) {
        return;
      }

      if (collectedErrors.length === promises.length) {
        requestDataPackagesLogger?.willReject();
        clearTimeout(timer);
        didResolveOrReject = true;
        reject(new AggregateError(collectedErrors));
      } else if (
        collectedResponses.length + collectedErrors.length ===
          promises.length ||
        (isTimedOut && collectedResponses.length !== 0)
      ) {
        const newestPackage = collectedResponses.reduce(
          (a, b) => (getResponseTimestamp(b) > getResponseTimestamp(a) ? b : a),
          {}
        );

        requestDataPackagesLogger?.willResolve(newestPackage);
        clearTimeout(timer);
        didResolveOrReject = true;
        resolve(newestPackage);
      }
    };

    for (let i = 0; i < promises.length; i++) {
      promises[i]
        .then((r) => {
          collectedResponses.push(r);
          requestDataPackagesLogger?.didReceiveResponse(r, i);
        })
        .catch((e) => {
          collectedErrors.push(e as Error);
          requestDataPackagesLogger?.didReceiveError(e, i);
        })
        .finally(checkResults);
    }
  });
};

const prepareDataPackagePromises = (
  reqParams: DataPackagesRequestParams,
  urls: string[],
  requestDataPackagesLogger?: RequestDataPackagesLogger
): Promise<DataPackagesResponse>[] => {
  if (reqParams.authorizedSigners && reqParams.authorizedSigners.length == 0) {
    throw new Error("authorizer signers array, if provided, cannot be empty");
  }
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

    return parseAndValidateDataPackagesResponse(
      response.data,
      reqParams,
      requestDataPackagesLogger
    );
  });
};

const parseAndValidateDataPackagesResponse = (
  responseData: unknown,
  reqParams: DataPackagesRequestParams,
  requestDataPackagesLogger?: RequestDataPackagesLogger
): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};

  RedstoneCommon.zodAssert<GwResponse>(GwResponseSchema, responseData);

  const requestedDataFeedIds = reqParams.dataPackagesIds;

  for (const dataFeedId of requestedDataFeedIds) {
    let dataFeedPackages = responseData[dataFeedId];

    if (!dataFeedPackages) {
      const message = `Requested data feed id is not included in response: ${dataFeedId}`;

      if (reqParams.ignoreMissingFeed) {
        requestDataPackagesLogger?.feedIsMissing(message);
        continue;
      }
      throw new Error(message);
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

    if (dataFeedPackages.length === 0) {
      const message = `No data packages for the data feed: ${dataFeedId}`;
      if (reqParams.ignoreMissingFeed) {
        requestDataPackagesLogger?.feedIsMissing(message);
        continue;
      } else {
        throw new Error(message);
      }
    } else if (dataFeedPackages.length < reqParams.uniqueSignersCount) {
      throw new Error(
        `Too few unique signers for the data feed: ${dataFeedId}. ` +
          `Expected: ${reqParams.uniqueSignersCount}. ` +
          `Received: ${dataFeedPackages.length}`
      );
    }

    const signedDataPackages = dataFeedPackages.map((dp) =>
      SignedDataPackage.fromObj(dp)
    );
    const timestamp = checkAndGetSameTimestamp(signedDataPackages);
    if (reqParams.maxTimestampDeviationMS) {
      const deviation = Math.abs(Date.now() - timestamp);
      if (deviation > reqParams.maxTimestampDeviationMS) {
        throw new Error(
          `Timestamp deviation exceeded - timestamp: ${timestamp}, deviation: ${deviation}, max deviation: ${reqParams.maxTimestampDeviationMS}`
        );
      }
    }

    parsedResponse[dataFeedId] = reqParams.disableMedianSelection
      ? signedDataPackages
      : pickDataFeedPackagesClosestToMedian(
          dataFeedPackages,
          reqParams.uniqueSignersCount
        );
  }

  return parsedResponse;
};

const getUrlsForDataServiceId = (
  reqParams: DataPackagesRequestParams
): string[] => {
  return reqParams.urls ?? resolveDataServiceUrls(reqParams.dataServiceId);
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

export const getDataPackagesTimestamp = (
  dataPackages: DataPackagesResponse,
  dataFeedId?: string
) => {
  const signedDataPackages = extractSignedDataPackagesForFeedId(
    dataPackages,
    dataFeedId
  );

  return checkAndGetSameTimestamp(signedDataPackages);
};

export const checkAndGetSameTimestamp = (dataPackages: SignedDataPackage[]) => {
  if (!dataPackages.length) {
    throw new Error("No data packages");
  }

  const timestamps = dataPackages.map(
    (dp) => dp.dataPackage.timestampMilliseconds
  );
  if (new Set(timestamps).size !== 1) {
    throw new Error(
      `Timestamps do not have the same value: ${timestamps.join(", ")}`
    );
  }

  return timestamps[0];
};

const extractSignedDataPackagesForFeedId = (
  dataPackages: DataPackagesResponse,
  dataFeedId?: string
) => {
  if (dataFeedId && dataPackages[dataFeedId]) {
    return dataPackages[dataFeedId];
  }

  const signedDataPackages = Object.values(dataPackages).flatMap(
    (dataPackages) => dataPackages!
  );

  if (!dataFeedId) {
    return signedDataPackages;
  }

  return signedDataPackages.filter((dataPackage) =>
    dataPackage.dataPackage.dataPoints.some(
      (dataPoint) => dataPoint.dataFeedId === dataFeedId
    )
  );
};

export function convertToHistoricalDataPackagesRequestParams(
  requestParams: DataPackagesRequestParams,
  config: {
    fallbackOffsetInMilliseconds: number;
    historicalPackagesGateways?: string[];
  },
  latestDataPackagesTimestamp?: number
) {
  const { fallbackOffsetInMilliseconds, historicalPackagesGateways } = config;

  if (
    !fallbackOffsetInMilliseconds ||
    !historicalPackagesGateways ||
    !Array.isArray(historicalPackagesGateways) ||
    !historicalPackagesGateways.length
  ) {
    throw new Error(
      `Historical packages fetcher for fallback deviation check is not properly configured: ` +
        `offset=${fallbackOffsetInMilliseconds} milliseconds., gateways=${JSON.stringify(
          historicalPackagesGateways
        )}, isArray=${Array.isArray(historicalPackagesGateways)} `
    );
  }

  let historicalTimestamp = calculateHistoricalPackagesTimestamp(
    fallbackOffsetInMilliseconds
  )!;
  if (
    latestDataPackagesTimestamp &&
    historicalTimestamp >= latestDataPackagesTimestamp
  ) {
    historicalTimestamp = calculateHistoricalPackagesTimestamp(
      Math.min(
        HISTORICAL_DATA_PACKAGES_DENOMINATOR_MS,
        fallbackOffsetInMilliseconds
      ),
      latestDataPackagesTimestamp
    )!;
  }

  return {
    ...requestParams,
    historicalTimestamp,
    urls: historicalPackagesGateways,
  };
}
