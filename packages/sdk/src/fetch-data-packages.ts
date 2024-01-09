import { RedstoneCommon, RedstoneTypes } from "@redstone-finance/utils";
import { resolveDataServiceUrls } from "./data-services-urls";

/** Fetches data-packages from gateway */
type FetchDataPackagesArgs = {
  dataServiceId: string;
  gatewayUrls?: string[];
};

export const fetchDataPackages = async ({
  dataServiceId,
  gatewayUrls,
}: FetchDataPackagesArgs): Promise<RedstoneTypes.DataPackageFromGatewayResponse> => {
  const resolvedGatewayUrls =
    gatewayUrls ?? resolveDataServiceUrls(dataServiceId);

  const urls = resolvedGatewayUrls.map(
    (baseUrl) => `${baseUrl}/data-packages/latest/${dataServiceId}`
  );

  const responseFromGateway =
    await RedstoneCommon.fetchWithFallbacks<RedstoneTypes.DataPackageFromGatewayResponse>(
      { urls }
    );

  return responseFromGateway.data;
};
