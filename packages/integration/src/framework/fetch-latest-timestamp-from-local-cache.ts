import axios from "axios";
import { DataPackages } from "./compare-data-packages";
import { GatewayInstance, getCacheServicePort } from "./gateway-manager";

export const fetchLatestTimestampFromLocal = async (
  gatewayInstance: GatewayInstance
) => {
  const responseFromCache = await axios.get<DataPackages>(
    `http://localhost:${getCacheServicePort(
      gatewayInstance,
      "direct"
    )}/data-packages/latest/mock-data-service`
  );
  const latestDataPackages = responseFromCache.data;
  const latestTimestamp =
    latestDataPackages[Object.keys(latestDataPackages)[0]]?.[0]
      ?.timestampMilliseconds;
  return latestTimestamp;
};
