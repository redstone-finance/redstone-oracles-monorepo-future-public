import { MathUtils, RedstoneTypes } from "@redstone-finance/utils";
import axios from "axios";
import { resolveDataServiceUrls } from "./data-services-urls";

export interface GetDataFeedValuesInput {
  aggregationAlgorithm?: "median" | "min" | "max"; // median by default
  dataServiceId?: string; // "redstone-main-demo" by default
  gatewayUrls?: string[]; // if not specified, use default for dataServiceId
}

export type GetDataFeedValuesOutput = Record<string, number | undefined>;
type GatewayResponse = RedstoneTypes.DataPackageFromGatewayResponse;

const DEFAULT_DATA_SERVICE_ID = "redstone-main-demo";
const DEFAULT_AGGREGATION_ALGORITHM = "median";

export const getDataFeedValues = async (
  args: GetDataFeedValuesInput = {}
): Promise<GetDataFeedValuesOutput> => {
  const dataServiceId = args.dataServiceId ?? DEFAULT_DATA_SERVICE_ID;
  const aggregationAlgorithm =
    args.aggregationAlgorithm ?? DEFAULT_AGGREGATION_ALGORITHM;
  const gatewayUrls = args.gatewayUrls ?? resolveDataServiceUrls(dataServiceId);

  const dataPackagesPerFeed = await Promise.any<GatewayResponse>(
    gatewayUrls.map((url) => getDataPackagesFromGateway(url, dataServiceId))
  );

  const result: GetDataFeedValuesOutput = {};

  for (const [dataPackageId, dataPackages] of Object.entries(
    dataPackagesPerFeed
  )) {
    if (isMultiPointDataPackageId(dataPackageId)) {
      continue;
    }
    const dataFeedId = dataPackageId;
    const plainValues = dataPackages!.map((dp) =>
      Number(dp.dataPoints[0].value)
    );

    result[dataFeedId] = aggregateValues(plainValues, aggregationAlgorithm);
  }

  return result;
};

const isMultiPointDataPackageId = (dataPackageId: string) =>
  dataPackageId.startsWith("__") && dataPackageId.endsWith("__");

const getDataPackagesFromGateway = async (
  url: string,
  dataServiceId: string
): Promise<GatewayResponse> => {
  const response = await axios.get<GatewayResponse>(
    `${url}/data-packages/latest/${dataServiceId}`
  );

  if (typeof response.data === "string") {
    throw new Error(
      `Failed to fetch data package from ${url}. Data service ID responded with: ${String(
        response.data
      )}`
    );
  }

  return response.data;
};

export const aggregateValues = (
  plainValues: number[],
  aggregationAlgorithm: "median" | "min" | "max"
) => {
  switch (aggregationAlgorithm) {
    case "max":
      return Math.max(...plainValues);
    case "min":
      return Math.min(...plainValues);
    case "median":
      return MathUtils.getMedian(plainValues);
    default:
      throw new Error(
        `Unsupported aggregationAlgorithm ${String(aggregationAlgorithm)}`
      );
  }
};
