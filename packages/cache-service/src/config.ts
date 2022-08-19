import { JWKInterface } from "arweave/node/lib/wallet";
import "dotenv/config";

interface CacheServiceConfig {
  mongoDbUrl: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  enableArchivingOnArweave: boolean;
  arweaveJwkKey?: JWKInterface;
}

const getEnv = (envName: string, required: boolean = true): string => {
  if (!process.env[envName] && required) {
    throw new Error(`Required env variable not found: ${envName}`);
  }
  return process.env[envName] || ("" as string);
};

const arweaveJwkKeyForArchiving = getEnv(
  "JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE",
  false
);

const config: CacheServiceConfig = {
  mongoDbUrl: getEnv("MONGO_DB_URL", false),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  enableDirectPostingRoutes: getEnv("ENABLE_DIRECT_POSTING_ROUTES") === "true",
  enableArchivingOnArweave: !!arweaveJwkKeyForArchiving,
};

if (config.enableArchivingOnArweave) {
  config.arweaveJwkKey = JSON.parse(arweaveJwkKeyForArchiving);
}

export default config;
