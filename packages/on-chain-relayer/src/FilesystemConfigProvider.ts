import dotenv from "dotenv";
import {
  ConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
} from "./types";
import fs from "fs";
import { makeConfigProvider } from "./make-config-provider";

dotenv.config();

const getFromEnv = (name: string, optional: boolean = false) => {
  const envValue = process.env[name];
  if (!envValue && !optional) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envValue;
};

// copy of method from oracle-node. Probably should be moved to some common package
function readJSON<T>(path: string): T {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content) as T;
  } catch (e: any) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}

export const fileSystemConfigProvider: ConfigProvider = () => {
  const manifestPath = getFromEnv("MANIFEST_FILE")!;
  const manifest = readJSON<OnChainRelayerManifest>(manifestPath);

  const env: OnChainRelayerEnv = {
    relayerIterationInterval: Number(getFromEnv("RELAYER_ITERATION_INTERVAL")),
    rpcUrl: getFromEnv("RPC_URL")!,
    privateKey: getFromEnv("PRIVATE_KEY")!,
    gasLimit: Number.parseInt(getFromEnv("GAS_LIMIT")!),
    healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL", true),
    expectedTxDeliveryTimeInMS: Number(
      getFromEnv("EXPECTED_TX_DELIVERY_TIME_IN_MS")
    ),
    isArbitrumNetwork: getFromEnv("IS_ARBITRUM_NETWORK", true) === "true",
    fallbackOffsetInMinutes: Number.parseInt(
      getFromEnv("FALLBACK_OFFSET_IN_MINUTES", true) ?? "0"
    ),
    historicalPackagesGateway: getFromEnv("HISTORICAL_PACKAGES_GATEWAY", true),
  };

  return makeConfigProvider(manifest, env);
};
