import { JWKInterface } from "arweave/node/lib/wallet";
import "dotenv/config";

interface CacheServiceConfigRequiredFields {
  appPort: number;
  mongoDbUrl: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  apiKeyForAccessToAdminRoutes: string;
  allowedStreamrDataServiceIds: string[];
  useMockOracleRegistryState: boolean;
  enableHistoricalDataServing: boolean;
}

type CacheServiceConfig =
  | (CacheServiceConfigRequiredFields & {
      enableArchivingOnArweave: true;
      arweaveJwkKey: JWKInterface;
      bundlrNodeUrl: string;
    })
  | (CacheServiceConfigRequiredFields & { enableArchivingOnArweave: false });

const DEFAULT_BUNDLR_NODE_URL = "https://node2.bundlr.network";
const DEFAULT_APP_PORT = 3000;

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
  appPort: Number(getEnv("APP_PORT", false) || DEFAULT_APP_PORT),
  mongoDbUrl: getEnv("MONGO_DB_URL", false),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  enableDirectPostingRoutes: getEnv("ENABLE_DIRECT_POSTING_ROUTES") === "true",
  apiKeyForAccessToAdminRoutes: getEnv("API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES"),
  enableArchivingOnArweave: !!arweaveJwkKeyForArchiving,
  bundlrNodeUrl: getEnv("BUNDLR_NODE_URL", false) || DEFAULT_BUNDLR_NODE_URL,
  allowedStreamrDataServiceIds: JSON.parse(
    getEnv("ALLOWED_STREAMR_DATA_SERVICE_IDS", false) || "[]"
  ),
  useMockOracleRegistryState: getEnv("USE_MOCK_ORACLE_STATE", false) === "true",
  enableHistoricalDataServing:
    getEnv("ENABLE_HISTORICAL_DATA_SERVING", false) === "true",
} as CacheServiceConfig;

if (config.enableArchivingOnArweave) {
  config.arweaveJwkKey = JSON.parse(arweaveJwkKeyForArchiving);
}

export default config;
