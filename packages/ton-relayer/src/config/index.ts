import "dotenv/config";

export const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

const API_V2_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export const config = Object.freeze({
  relayerIterationInterval: getFromEnv("RELAYER_ITERATION_INTERVAL"),
  healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL"),
  endpoint: API_V2_ENDPOINT,
  apiKey: getFromEnv("TONCENTER_API_KEY"),
  walletMnemonic: getFromEnv("WALLET_MNEMONIC").split(" "),
  manifestFile: getFromEnv("MANIFEST_FILE"),
});
