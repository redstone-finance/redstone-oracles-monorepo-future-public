import dotenv from "dotenv";
import {
  ConditionChecksNames,
  ConfigProvider,
  OnChainRelayerManifest,
} from "./types";
import fs from "fs";

dotenv.config();

const DEFAULT_ADAPTER_CONTRACT_TYPE = "price-feeds";

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
  const mainfestPath = getFromEnv("MANIFEST_FILE")!;
  const manifest = readJSON<OnChainRelayerManifest>(mainfestPath);
  const { timeSinceLastUpdateInMilliseconds, deviationPercentage } =
    manifest.updateTriggers;
  let updateConditions = [] as ConditionChecksNames[];
  if (timeSinceLastUpdateInMilliseconds) {
    updateConditions.push("time");
  }
  if (deviationPercentage) {
    updateConditions.push("value-deviation");
  }
  return Object.freeze({
    relayerIterationInterval: Number(getFromEnv("RELAYER_ITERATION_INTERVAL")),
    updatePriceInterval: timeSinceLastUpdateInMilliseconds,
    rpcUrl: getFromEnv("RPC_URL")!,
    chainName: manifest.chain.name!,
    chainId: manifest.chain.id,
    privateKey: getFromEnv("PRIVATE_KEY")!,
    adapterContractAddress: manifest.adapterContract,
    dataServiceId: manifest.dataServiceId,
    uniqueSignersCount: Number(getFromEnv("UNIQUE_SIGNERS_COUNT")),
    dataFeeds: Object.keys(manifest.priceFeeds),
    cacheServiceUrls: JSON.parse(getFromEnv("CACHE_SERVICE_URLS")!) as string[],
    gasLimit: Number.parseInt(getFromEnv("GAS_LIMIT")!),
    updateConditions: updateConditions,
    minDeviationPercentage: deviationPercentage,
    healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL", true),
    adapterContractType:
      getFromEnv("ADAPTER_CONTRACT_TYPE", true) ??
      DEFAULT_ADAPTER_CONTRACT_TYPE,
    expectedTxDeliveryTimeInMS: Number(
      getFromEnv("EXPECTED_TX_DELIVERY_TIME_IN_MS")
    ),
    isArbitrumNetwork: getFromEnv("IS_ARBITRUM_NETWORK", true) === "true",
  });
};
