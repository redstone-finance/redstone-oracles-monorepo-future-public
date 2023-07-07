import dotenv from "dotenv";
import { ConditionChecksNames } from "./types";

dotenv.config();

const DEFAULT_ADAPTER_CONTRACT_TYPE = "price-feeds";

const getFromEnv = (name: string, optional: boolean = false) => {
  const envVariable = process.env[name];
  const env = process.env.NODE_ENV;
  if (!envVariable && env !== "test" && !optional) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export const config = Object.freeze({
  relayerIterationInterval: Number(
    getFromEnv("RELAYER_ITERATION_INTERVAL")
  ) as number,
  updatePriceInterval: Number(getFromEnv("UPDATE_PRICE_INTERVAL")) as number,
  rpcUrl: getFromEnv("RPC_URL") as string,
  chainName: getFromEnv("CHAIN_NAME") as string,
  chainId: getFromEnv("CHAIN_ID") as string,
  privateKey: getFromEnv("PRIVATE_KEY") as string,
  adapterContractAddress: getFromEnv("ADAPTER_CONTRACT_ADDRESS") as string,
  dataServiceId: getFromEnv("DATA_SERVICE_ID") as string,
  uniqueSignersCount: Number(getFromEnv("UNIQUE_SIGNERS_COUNT")) as number,
  dataFeeds: JSON.parse(getFromEnv("DATA_FEEDS") ?? "[]") as string[],
  cacheServiceUrls: JSON.parse(
    getFromEnv("CACHE_SERVICE_URLS") ?? "[]"
  ) as string[],
  gasLimit: Number.parseInt(getFromEnv("GAS_LIMIT")!),
  updateConditions: JSON.parse(
    getFromEnv("UPDATE_CONDITIONS") ?? "[]"
  ) as ConditionChecksNames[],
  minDeviationPercentage: Number(
    getFromEnv(
      "MIN_DEVIATION_PERCENTAGE",
      !(
        JSON.parse(getFromEnv("UPDATE_CONDITIONS") ?? "[]") as string[]
      ).includes("value-deviation")
    )
  ) as number,
  healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL", true),
  adapterContractType:
    getFromEnv("ADAPTER_CONTRACT_TYPE", true) ?? DEFAULT_ADAPTER_CONTRACT_TYPE,
  expectedTxDeliveryTimeInMS: Number(
    getFromEnv("EXPECTED_TX_DELIVERY_TIME_IN_MS", false)
  ),
  isArbitrumNetwork: getFromEnv("IS_ARBITRUM_NETWORK", true) === "true",
});

/// Config validation ///

// Validating adapter contract type
if (!["mento", "price-feeds"].includes(config.adapterContractType)) {
  const errMsg = `Adapter contract type not supported: ${config.adapterContractType}`;
  throw new Error(errMsg);
}

// Preventing unsupported update condition for mento adapter type
if (
  config.adapterContractType === "mento" &&
  config.updateConditions.includes("value-deviation")
) {
  const errMsg = `Mento adapter does not support the value-deviation update condition`;
  throw new Error(errMsg);
}
