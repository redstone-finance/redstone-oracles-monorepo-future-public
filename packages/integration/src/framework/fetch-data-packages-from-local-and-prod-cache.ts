import axios from "axios";
import { CacheLayerInstance } from "./cache-layer-manager";
import { DataPackages } from "./compare-data-packages";

const HISTORICAL_ORACLE_GATEWAY_URL =
  "https://oracle-gateway-2.a.redstone.finance/data-packages/historical";

export const fetchDataPackagesFromCaches = async (
  cacheLayerInstance: CacheLayerInstance,
  timestamp: number,
  manifestFileName: string
) => {
  const responseFromLocalCache = (
    await axios.get<DataPackages>(
      `http://localhost:${cacheLayerInstance.directCacheServicePort}/data-packages/historical/mock-data-service/${timestamp}`
    )
  ).data;

  const prodDataServiceName = manifestFileName.replace("data-services/", "");
  const responseFromProdCache = (
    await axios.get<DataPackages>(
      `${HISTORICAL_ORACLE_GATEWAY_URL}/redstone-${prodDataServiceName}-prod/${timestamp}`
    )
  ).data;

  return { responseFromLocalCache, responseFromProdCache, timestamp };
};
