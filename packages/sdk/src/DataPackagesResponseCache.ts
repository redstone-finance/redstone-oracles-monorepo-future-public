import { loggerFactory } from "@redstone-finance/utils";
import _ from "lodash";
import {
  DataPackagesRequestParams,
  DataPackagesResponse,
} from "./request-data-packages";

export class DataPackagesResponseCache {
  private logger = loggerFactory("data-packages-response-cache");

  private response?: DataPackagesResponse;
  private requestParams?: DataPackagesRequestParams;

  update(
    dataPackagesResponse: DataPackagesResponse,
    requestParams: DataPackagesRequestParams
  ) {
    this.response = dataPackagesResponse;
    this.requestParams = requestParams;
  }

  invalidate() {
    this.response = undefined;
    this.requestParams = undefined;
  }

  get(requestParams: DataPackagesRequestParams) {
    if (!this.requestParams || !this.response) {
      this.logger.debug(
        "Trying to use cache when there doesn't exist a cached value",
        {
          requestParams,
          cachedRequestParams: this.requestParams,
          cachedResponse: this.response,
        }
      );

      return undefined;
    }

    const isRequestConformingToTheCachedValue = isConforming(
      this.requestParams,
      requestParams,
      Object.keys(this.response)
    );
    if (!isRequestConformingToTheCachedValue) {
      this.logger.debug(
        "The request params are not conforming to the cached value",
        {
          requestParams,
          cachedRequestParams: this.requestParams,
          cachedResponse: this.response,
        }
      );

      return undefined;
    }

    return filterDataPackages(this.response, requestParams.dataPackagesIds);
  }
}

/**
 * Determines if the cached response conforms to the specified request parameters.
 *
 * Returns `false` if:
 * 1. The cached value doesn't exist for the request parameters set (defined by `makeComparableRequestParams`).
 * 2. The requested data feeds are not a subset of the cached response's data feeds,
 *    and `ignoreMissingFeed` is set to `false`.
 *
 * Returns `true` otherwise.
 *
 * @returns `true` if the cached response conforms to the request; otherwise, `false`.
 */
function isConforming(
  thisRequestParams: DataPackagesRequestParams,
  otherRequestParams: DataPackagesRequestParams,
  currentResponseDataPackageIds: string[]
) {
  const thisComparableRequestParams =
    makeComparableRequestParams(thisRequestParams);
  const otherComparableRequestParams =
    makeComparableRequestParams(otherRequestParams);

  if (!_.isEqual(thisComparableRequestParams, otherComparableRequestParams)) {
    return false;
  }

  if (otherRequestParams.ignoreMissingFeed) {
    return true;
  }

  return isSubsetOf(
    new Set(currentResponseDataPackageIds),
    new Set(otherRequestParams.dataPackagesIds)
  );
}

function makeComparableRequestParams(requestParams: DataPackagesRequestParams) {
  const {
    dataServiceId,
    uniqueSignersCount,
    authorizedSigners,
    maxTimestampDeviationMS,
    historicalTimestamp,
    ignoreMissingFeed,
  } = requestParams;

  return {
    dataServiceId,
    uniqueSignersCount,
    authorizedSigners,
    maxTimestampDeviationMS,
    historicalTimestamp,
    ignoreMissingFeed,
  };
}

function filterDataPackages(
  currentResponse: DataPackagesResponse,
  dataPackageIdsToInclude: string[]
): DataPackagesResponse {
  if (
    isSubsetOf(
      new Set(dataPackageIdsToInclude),
      new Set(Object.keys(currentResponse))
    )
  ) {
    return currentResponse;
  }

  return _.pick(currentResponse, dataPackageIdsToInclude);
}

export function isSubsetOf<T>(superset: Set<T>, subset: Set<T>) {
  for (const elem of subset) {
    if (!superset.has(elem)) {
      return false;
    }
  }
  return true;
}
