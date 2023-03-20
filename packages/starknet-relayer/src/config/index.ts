import dotenv from "dotenv";

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
  network: getFromEnv("NETWORK"),
  privateKey: getFromEnv("PRIVATE_KEY"),
  managerAddress: getFromEnv("MANAGER_ADDRESS"),
  ownerAddress: getFromEnv("OWNER_ADDRESS"),
  maxEthFee: getFromEnv("MAX_ETH_FEE"),
});
