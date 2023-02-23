import dotenv from "dotenv";
import abi from "./price-feeds-manager.abi.json";

dotenv.config();

const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export const config = Object.freeze({
  relayerIterationInterval: getFromEnv("RELAYER_ITERATION_INTERVAL"),
  updatePriceInterval: getFromEnv("UPDATE_PRICE_INTERVAL"),
  rpcUrl: getFromEnv("RPC_URL"),
  chainName: getFromEnv("CHAIN_NAME"),
  chainId: getFromEnv("CHAIN_ID"),
  privateKey: getFromEnv("PRIVATE_KEY"),
  managerContractAddress: getFromEnv("MANGER_CONTRACT_ADDRESS"),
  abi,
  dataServiceId: getFromEnv("DATA_SERVICE_ID"),
  uniqueSignersCount: Number(getFromEnv("UNIQUE_SIGNERS_COUNT")),
  dataFeeds: JSON.parse(getFromEnv("DATA_FEEDS")),
  cacheServiceUrls: JSON.parse(getFromEnv("CACHE_SERVICE_URLS")),
});
