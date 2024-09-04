import dayjs from "dayjs";
import _ from "lodash";

export type Manifest<T = unknown> = {
  defaultConfig: T;
  temporaryConfigUpdates?: { expirationTimestamp?: string };
};

const DAY_IN_MS = 24 * 3600 * 1000;
const MAX_EXPIRATION_PERIOD = 7 * DAY_IN_MS;

export function resolveManifest<T>(manifest: Manifest<T>): T {
  const { defaultConfig, temporaryConfigUpdates } = manifest;

  const expirationTimestamp = validateExpirationTimestamp(
    parseExpirationTimestamp(temporaryConfigUpdates?.expirationTimestamp)
  );

  if (temporaryConfigUpdates) {
    delete temporaryConfigUpdates["expirationTimestamp"];
  }

  const applyTemporaryConfig =
    temporaryConfigUpdates && expirationTimestamp > Date.now();

  const finalConfig = applyTemporaryConfig
    ? _.merge(defaultConfig, temporaryConfigUpdates)
    : defaultConfig;

  return finalConfig;
}

function parseExpirationTimestamp(
  timestamp: string | number | undefined
): number {
  if (timestamp === undefined) {
    return 0;
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }
  const parsedTimestamp = dayjs(timestamp).valueOf();
  if (isNaN(parsedTimestamp)) {
    throw new Error(`provided timestamp ${timestamp} cannot be parsed`);
  }
  return parsedTimestamp;
}

function validateExpirationTimestamp(timestamp: number) {
  if (timestamp > Date.now() + MAX_EXPIRATION_PERIOD) {
    throw new Error(
      `expirationTimestamp is bigger than ${(
        MAX_EXPIRATION_PERIOD / DAY_IN_MS
      ).toFixed(0)} days`
    );
  }
  return timestamp;
}
