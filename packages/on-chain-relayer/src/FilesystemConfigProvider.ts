import "dotenv/config";
import {
  ConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
} from "./types";
import fs from "fs";
import { makeConfigProvider } from "./make-config-provider";

const getFromEnv = (name: string, optional: boolean = false) => {
  const envValue = process.env[name];
  if (!envValue && !optional) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envValue;
};

// copy of method from oracle-node. Probably should be moved to some common package
const readJSON = <T>(path: string): T => {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content) as T;
  } catch (e: any) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
};

const getJSONFromEnv = <T>(
  varName: string,
  optional = false
): T | undefined => {
  const envVal = getFromEnv(varName, optional);
  if (!envVal) {
    return;
  }
  try {
    return JSON.parse(envVal) as T;
  } catch (e: any) {
    if (!optional) {
      throw e;
    }
  }
  return undefined;
};

export const fileSystemConfigProvider: ConfigProvider = () => {
  const manifestPath = getFromEnv("MANIFEST_FILE")!;
  const manifest = readJSON<OnChainRelayerManifest>(manifestPath);

  const env: OnChainRelayerEnv = {
    relayerIterationInterval: Number(getFromEnv("RELAYER_ITERATION_INTERVAL")),
    rpcUrls: JSON.parse(getFromEnv("RPC_URLS")!),
    privateKey: getFromEnv("PRIVATE_KEY")!,
    gasLimit: Number.parseInt(getFromEnv("GAS_LIMIT")!),
    gasMultiplier: Number.parseFloat(
      getFromEnv("GAS_MULTIPLIER", true) || "1.125"
    ),
    healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL", true),
    expectedTxDeliveryTimeInMS: Number(
      getFromEnv("EXPECTED_TX_DELIVERY_TIME_IN_MS")
    ),
    isArbitrumNetwork: getFromEnv("IS_ARBITRUM_NETWORK", true) === "true",
    fallbackOffsetInMinutes: Number.parseInt(
      getFromEnv("FALLBACK_OFFSET_IN_MINUTES", true) ?? "0"
    ),
    cacheServiceUrls: getJSONFromEnv("CACHE_SERVICE_URLS", true),
    historicalPackagesGateways: getJSONFromEnv(
      "HISTORICAL_PACKAGES_GATEWAYS",
      true
    ),
    isAuctionModel: getFromEnv("IS_AUCTION_MODEL", true) === "true",
  };

  return makeConfigProvider(manifest, env);
};
