import axios from "axios";
import { BigNumber, utils } from "ethers";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
  INumericDataPoint,
  RedstonePayload,
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";
import { resolveDataServiceUrls } from "./data-services-urls";
import { SafeNumber, MathUtils } from "redstone-utils";

const ALL_FEEDS_KEY = "___ALL_FEEDS___";
const DEFAULT_DECIMALS = 8;

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds?: string[];
  disablePayloadsDryRun?: boolean;
  urls?: string[];
  valuesToCompare?: ValuesForDataFeeds;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: SignedDataPackage[];
}

export interface ValuesForDataFeeds {
  [dataFeedId: string]: BigNumber;
}

export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return redstoneOraclesInitialState;
  };

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

export const parseDataPackagesResponse = (
  dpResponse: {
    [dataFeedId: string]: SignedDataPackagePlainObj[];
  },
  reqParams: DataPackagesRequestParams
): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};

  const requestedDataFeedIds = reqParams.dataFeeds ?? [ALL_FEEDS_KEY];

  for (const dataFeedId of requestedDataFeedIds) {
    const dataFeedPackages = dpResponse[dataFeedId];

    if (!dataFeedPackages) {
      throw new Error(
        `Requested data feed id is not included in response: ${dataFeedId}`
      );
    }

    if (dataFeedPackages.length < reqParams.uniqueSignersCount) {
      throw new Error(
        `Too few unique signers for the data feed: ${dataFeedId}. ` +
          `Expected: ${reqParams.uniqueSignersCount}. ` +
          `Received: ${dataFeedPackages.length}`
      );
    }

    const dataFeedPackagesSorted = getDataPackagesSortedByDeviation(
      dataFeedPackages,
      reqParams.valuesToCompare,
      dataFeedId
    );

    parsedResponse[dataFeedId] = dataFeedPackagesSorted
      .slice(0, reqParams.uniqueSignersCount)
      .map((dataPackage: SignedDataPackagePlainObj) =>
        SignedDataPackage.fromObj(dataPackage)
      );
  }

  return parsedResponse;
};

const getDataPackagesSortedByDeviation = (
  dataFeedPackages: SignedDataPackagePlainObj[],
  valuesToCompare: ValuesForDataFeeds | undefined,
  dataFeedId: string
) => {
  if (!valuesToCompare) {
    return dataFeedPackages;
  }

  if (dataFeedId === ALL_FEEDS_KEY) {
    throw new Error(
      `Cannot sort data packages by deviation for ${ALL_FEEDS_KEY}`
    );
  }

  if (!valuesToCompare[dataFeedId]) {
    return dataFeedPackages;
  }

  const decimals =
    getDecimalsForDataFeedId(dataFeedPackages) ?? DEFAULT_DECIMALS;
  const valueToCompare = Number(
    utils.formatUnits(valuesToCompare[dataFeedId], decimals)
  );

  return sortDataPackagesByDeviationDesc(dataFeedPackages, valueToCompare);
};

export const getDecimalsForDataFeedId = (
  dataPackages: SignedDataPackagePlainObj[]
) => {
  const firstDecimal = (dataPackages[0].dataPoints[0] as INumericDataPoint)
    .decimals;
  const areAllDecimalsEqual = dataPackages.every((dataPackage) =>
    dataPackage.dataPoints.every(
      (dataPoint) => (dataPoint as INumericDataPoint).decimals === firstDecimal
    )
  );

  if (!areAllDecimalsEqual) {
    throw new Error("Decimals from data points in data packages are not equal");
  }
  return firstDecimal;
};

const errToString = (e: any): string => {
  if (e instanceof AggregateError) {
    const stringifiedErrors = e.errors.reduce(
      (prev, oneOfErrors, curIndex) =>
        (prev += `${curIndex}: ${oneOfErrors.message}, `),
      ""
    );
    return `${e.message}: ${stringifiedErrors}`;
  } else {
    return e.message;
  }
};

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  const promises = prepareDataPackagePromises(reqParams);
  try {
    return await Promise.any(promises);
  } catch (e: any) {
    const errMessage = `Request failed ${JSON.stringify({
      reqParams,
    })}, Original error: ${errToString(e)}`;
    throw new Error(errMessage);
  }
};

const prepareDataPackagePromises = (reqParams: DataPackagesRequestParams) => {
  const urls = getUrlsForDataServiceId(reqParams);
  return urls.map((url) =>
    axios
      .get(`${url}/data-packages/latest/${reqParams.dataServiceId}`)
      .then((response) => parseDataPackagesResponse(response.data, reqParams))
  );
};

export const requestRedstonePayload = async (
  reqParams: DataPackagesRequestParams,
  unsignedMetadataMsg?: string
): Promise<string> => {
  const signedDataPackagesResponse = await requestDataPackages(reqParams);
  const signedDataPackages = Object.values(signedDataPackagesResponse).flat();

  return RedstonePayload.prepare(signedDataPackages, unsignedMetadataMsg || "");
};

export const getUrlsForDataServiceId = (
  reqParams: DataPackagesRequestParams
): string[] => {
  if (reqParams.urls) {
    return reqParams.urls;
  }
  return resolveDataServiceUrls(reqParams.dataServiceId);
};

const sortDataPackagesByDeviationDesc = (
  dataPackages: SignedDataPackagePlainObj[],
  valueToCompare: number
) =>
  dataPackages.sort((leftDataPackage, rightDataPackage) => {
    const leftValue = SafeNumber.createSafeNumber(
      leftDataPackage.dataPoints[0].value
    );
    const leftValueDeviation = SafeNumber.calculateDeviationPercent({
      currValue: leftValue,
      prevValue: SafeNumber.createSafeNumber(valueToCompare),
    });
    const rightValue = SafeNumber.createSafeNumber(
      rightDataPackage.dataPoints[0].value
    );
    const rightValueDeviation = SafeNumber.calculateDeviationPercent({
      currValue: rightValue,
      prevValue: SafeNumber.createSafeNumber(valueToCompare),
    });

    return rightValueDeviation.sub(leftValueDeviation).unsafeToNumber();
  });

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
  requestRedstonePayload,
  resolveDataServiceUrls,
  getDecimalsForDataFeedId,
};
export * from "./data-services-urls";
export * from "./contracts/ContractParamsProvider";
export * from "./contracts/IContractConnector";
export * from "./contracts/prices/IPricesContractAdapter";
