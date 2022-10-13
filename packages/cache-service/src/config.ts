import { JWKInterface } from "arweave/node/lib/wallet";
import "dotenv/config";

interface CacheServiceConfigRequiredFields {
  mongoDbUrl: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  mockDataServiceIdForPackages: boolean;
}

type CacheServiceConfig =
  | (CacheServiceConfigRequiredFields & {
      enableArchivingOnArweave: true;
      arweaveJwkKey: JWKInterface;
      bundlrNodeUrl: string;
    })
  | (CacheServiceConfigRequiredFields & { enableArchivingOnArweave: false });

const DEFAULT_BUNDLR_NODE_URL = "https://node2.bundlr.network";

const getEnv = (envName: string, required = true): string => {
  if (!process.env[envName] && required) {
    throw new Error(`Required env variable not found: ${envName}`);
  }
  return process.env[envName] || ("" as string);
};

const arweaveJwkKeyForArchiving = getEnv(
  "JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE",
  false
);

const config = {
  mongoDbUrl: getEnv("MONGO_DB_URL", false),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  enableDirectPostingRoutes: getEnv("ENABLE_DIRECT_POSTING_ROUTES") === "true",
  enableArchivingOnArweave: !!arweaveJwkKeyForArchiving,
  bundlrNodeUrl: getEnv("BUNDLR_NODE_URL", false) || DEFAULT_BUNDLR_NODE_URL,
  mockDataServiceIdForPackages:
    getEnv("MOCK_DATA_SERVICE_ID_FOR_PACKAGES", false) === "true",
} as CacheServiceConfig;

if (config.enableArchivingOnArweave) {
  config.arweaveJwkKey = JSON.parse(arweaveJwkKeyForArchiving);
}

export default config;
