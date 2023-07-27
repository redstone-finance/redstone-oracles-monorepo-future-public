import axios from "axios";
import { CacheLayerInstance } from "./cache-layer-manager";

export const fetchDataPackagesFromCaches = async (
  cacheLayerInstance: CacheLayerInstance,
  timestamp: number,
  manifestFileName: string
) => {
  const responseFromLocalCache = (
    await axios.get(
      `http://localhost:${cacheLayerInstance.directCacheServicePort}/data-packages/historical/mock-data-service/${timestamp}`
    )
  ).data;
  const responseFromProdCache = (
    await axios.get(
      `https://oracle-gateway-2.a.redstone.finance/data-packages/historical/redstone-${manifestFileName}-prod/${timestamp}`
    )
  ).data;

  return { responseFromLocalCache, responseFromProdCache, timestamp };
};
