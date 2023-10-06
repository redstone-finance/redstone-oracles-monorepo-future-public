import { TonApiV2Config } from "../network/TonNetwork";

const API_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export type TonConnectorConfig = TonApiV2Config & {
  mnemonic: string[];
};

export const config = Object.freeze(<TonConnectorConfig>{
  mnemonic: getFromEnv("WALLET_MNEMONIC").split(" "),
  apiKey: getFromEnv("TONCENTER_API_KEY"),
  endpoint: API_ENDPOINT,
});
