import "dotenv/config";

interface CacheServiceConfig {
  appPort: number;
  // empty string means that in-memory DB will be created and used
  // e.g. by e2e test process
  mongoDbUrl?: string;
  mongoDbTTLSeconds: number;
  streamrPrivateKey?: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  apiKeyForAccessToAdminRoutes: string;
  allowedStreamrDataServiceIds: string[];
  useMockOracleRegistryState: boolean;
  enableHistoricalDataServing: boolean;
  secondMongoDbUrl?: string;
  maxAllowedTimestampDelay: number;
  dataPackagesTTL: number;
}

const DEFAULT_APP_PORT = 3000;
const DEFAULT_MAX_ALLOWED_TIMESTAMP_DELAY = 90 * 1000; // 1.5 minutes in milliseconds

// Cache TTL can slightly increase the data delay, but having efficient
// caching is crucial for the app performance. Assuming, that we have 10s
// update frequency in nodes, 5s cache TTL on the app level, and 5s cache TTL
// on the CDN level - then the max data delay is ~20s, which is still good enough :)
const CACHE_TTL = 5000;

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

const config: CacheServiceConfig = {
  appPort: Number(getEnv("APP_PORT", false) || DEFAULT_APP_PORT),
  mongoDbUrl: getEnv("MONGO_DB_URL", false),
  mongoDbTTLSeconds: Number(getEnv("MONGO_DB_TTL_SECONDS", false) || 0),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  streamrPrivateKey: getEnv("STREAMR_PRIVATE_KEY", false),
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
  dataPackagesTTL: Number(getEnv("DATA_PACKAGES_TTL", false) || CACHE_TTL),
};

export default config;
