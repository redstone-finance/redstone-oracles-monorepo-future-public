import { JWKInterface } from "arweave/node/lib/wallet";
import "dotenv/config";

interface CacheServiceConfigRequiredFields {
  appPort: number;
  // empty string means that in-memory DB will be created and used
  // e.g. by e2e test process
  mongoDbUrl: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  apiKeyForAccessToAdminRoutes: string;
  allowedStreamrDataServiceIds: string[];
  useMockOracleRegistryState: boolean;
  enableHistoricalDataServing: boolean;
  secondMongoDbUrl?: string;
  maxAllowedTimestampDelay: number;
}

type CacheServiceConfigOptionalFields =
  | {
      enableArchivingOnArweave: true;
      arweaveJwkKey: JWKInterface;
      bundlrNodeUrl: string;
    }
  | { enableArchivingOnArweave: false };

type CacheServiceConfig = CacheServiceConfigRequiredFields &
  CacheServiceConfigOptionalFields;

const DEFAULT_BUNDLR_NODE_URL = "https://node2.bundlr.network";
const DEFAULT_APP_PORT = 3000;
const DEFAULT_MAX_ALLOWED_TIMESTAMP_DELAY = 90 * 1000; // 1.5 minutes in milliseconds

type GetEnvType = {
  (envName: string, required: false): string | undefined;
  (envName: string, required: boolean): string | undefined;
  (envName: string, required?: true): string;
};

const getEnv: GetEnvType = (envName: string, required: boolean = true) => {
  if (process.env[envName] === undefined && required) {
    throw new Error(`Required env variable not found: ${envName}`);
  }
  return process.env[envName]!;
};

const arweaveJwkKeyForArchiving = getEnv(
  "JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE",
  false
);

const optionalConfig: CacheServiceConfigOptionalFields =
  arweaveJwkKeyForArchiving
    ? {
        enableArchivingOnArweave: true,
        arweaveJwkKey: JSON.parse(arweaveJwkKeyForArchiving) as JWKInterface,
        bundlrNodeUrl:
          getEnv("BUNDLR_NODE_URL", false) || DEFAULT_BUNDLR_NODE_URL,
      }
    : { enableArchivingOnArweave: false };

const config: CacheServiceConfig = {
  appPort: Number(getEnv("APP_PORT", false) || DEFAULT_APP_PORT),
  mongoDbUrl: getEnv("MONGO_DB_URL"),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  enableDirectPostingRoutes: getEnv("ENABLE_DIRECT_POSTING_ROUTES") === "true",
  apiKeyForAccessToAdminRoutes: getEnv("API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES"),
  allowedStreamrDataServiceIds: JSON.parse(
    getEnv("ALLOWED_STREAMR_DATA_SERVICE_IDS", false) || "[]"
  ) as string[],
  useMockOracleRegistryState: getEnv("USE_MOCK_ORACLE_STATE", false) === "true",
  enableHistoricalDataServing:
    getEnv("ENABLE_HISTORICAL_DATA_SERVING", false) === "true",
  secondMongoDbUrl: getEnv("SECOND_MONGO_DB_URL", false),
  maxAllowedTimestampDelay: Number(
    getEnv("MAX_ALLOWED_TIMESTAMP_DELAY", false) ||
      DEFAULT_MAX_ALLOWED_TIMESTAMP_DELAY
  ),
  ...optionalConfig,
};

export default config;
