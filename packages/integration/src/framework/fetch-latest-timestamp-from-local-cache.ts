import axios from "axios";
import { CacheLayerInstance } from "./cache-layer-manager";
import { DataPackages } from "./compare-data-packages";

export const fetchLatestTimestampFromLocal = async (
  cacheLayerInstance: CacheLayerInstance
) => {
  const responseFromCache = await axios.get<DataPackages>(
    `http://localhost:${cacheLayerInstance.directCacheServicePort}/data-packages/latest/mock-data-service`
  );
  const latestDataPackages = responseFromCache.data;
  const latestTimestamp =
    latestDataPackages[Object.keys(latestDataPackages)[0]]?.[0]
      ?.timestampMilliseconds;
  return latestTimestamp;
};
