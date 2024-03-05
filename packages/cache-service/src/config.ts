import { RedstoneCommon, RedstoneConstants } from "@redstone-finance/utils";
import "dotenv/config";
import { z } from "zod";

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
  streamrStreamNamePattern: string;
  keepAliveTimeoutInSeconds: number;
}

const DEFAULT_APP_PORT = 3000;

// Cache TTL can slightly increase the data delay, but having efficient
// caching is crucial for the app performance. Assuming, that we have 10s
// update frequency in nodes, 5s cache TTL on the app level, and 5s cache TTL
// on the CDN level - then the max data delay is ~20s, which is still good enough :)
const CACHE_TTL = 5000;

const config: CacheServiceConfig = {
  appPort: RedstoneCommon.getFromEnv(
    "APP_PORT",
    z.number().default(DEFAULT_APP_PORT)
  ),
  mongoDbUrl: RedstoneCommon.getFromEnv("MONGO_DB_URL", z.string().optional()),
  mongoDbTTLSeconds: RedstoneCommon.getFromEnv(
    "MONGO_DB_TTL_SECONDS",
    z.number().default(0)
  ),
  enableStreamrListening: RedstoneCommon.getFromEnv(
    "ENABLE_STREAMR_LISTENING",
    z.boolean()
  ),
  streamrPrivateKey: RedstoneCommon.getFromEnv(
    "STREAMR_PRIVATE_KEY",
    z.string().optional(),
    false
  ),
  enableDirectPostingRoutes: RedstoneCommon.getFromEnv(
    "ENABLE_DIRECT_POSTING_ROUTES",
    z.boolean()
  ),
  apiKeyForAccessToAdminRoutes: RedstoneCommon.getFromEnv(
    "API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES"
  ),
  allowedStreamrDataServiceIds: RedstoneCommon.getFromEnv(
    "ALLOWED_STREAMR_DATA_SERVICE_IDS",
    z.array(z.string()).default([])
  ),
  useMockOracleRegistryState: RedstoneCommon.getFromEnv(
    "USE_MOCK_ORACLE_STATE",
    z.boolean().default(false)
  ),
  enableHistoricalDataServing: RedstoneCommon.getFromEnv(
    "ENABLE_HISTORICAL_DATA_SERVING",
    z.boolean().default(false)
  ),
  secondMongoDbUrl: RedstoneCommon.getFromEnv(
    "SECOND_MONGO_DB_URL",
    z.string().url().optional()
  ),
  maxAllowedTimestampDelay: RedstoneCommon.getFromEnv(
    "MAX_ALLOWED_TIMESTAMP_DELAY",
    z
      .number()
      .positive()
      .default(RedstoneConstants.DEFAULT_LATEST_DATA_PACKAGES_MAX_DELAY_MS)
  ),
  dataPackagesTTL: RedstoneCommon.getFromEnv(
    "DATA_PACKAGES_TTL",
    z.number().default(CACHE_TTL)
  ),
  streamrStreamNamePattern: RedstoneCommon.getFromEnv(
    "STREAMR_STREAM_NAME_PATTERN",
    z.string().default("/redstone-oracle-node/{evmAddress}/data-packages")
  ),
  keepAliveTimeoutInSeconds: RedstoneCommon.getFromEnv(
    "KEEP_ALIVE_TIMEOUT_IN_SECONDS",
    z.number().default(60)
  ),
};

export default config;
