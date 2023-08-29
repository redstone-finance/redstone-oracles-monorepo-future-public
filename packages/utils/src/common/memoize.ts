import { assertWithLog } from "./errors";

type MemoizeCache<T> = { promise: Promise<T>; lastSet: number };
type MemoizeArgs<T, A extends unknown[]> = {
  functionToMemoize: (...args: A) => Promise<T>;
  ttl: number;
  cacheKeyBuilder?: (args: A) => string;
};
const EXPECTED_MAX_CACHE_ENTRIES_PER_FN = 10_000;
const EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN = 10_000;

/**
 * Be default for building cacheKey JSON.stringify function is used, thus order of keys in object matters
 */
export function memoize<T, A extends unknown[]>({
  functionToMemoize,
  ttl,
  cacheKeyBuilder = JSON.stringify,
}: MemoizeArgs<T, A>): (...args: A) => Promise<T> {
  const cache: Record<string, MemoizeCache<T>> = {};

  return async (...args: A) => {
    const cacheKey = cacheKeyBuilder(args);

    assertWithLog(
      cacheKey.length < EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN,
      `Assumed cache key will not be longer then ${EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN}`
    );

    // to avoid caching results forever
    cleanStaleCacheEntries(cache, ttl);

    if (!cache[cacheKey] || Date.now() - cache[cacheKey].lastSet > ttl) {
      cache[cacheKey] = {
        lastSet: Date.now(),
        promise: functionToMemoize(...args).catch((err) => {
          // don't propagate cache when promise resolves to error
          delete cache[cacheKey];
          throw err;
        }),
      };
    }
    return await cache[cacheKey].promise;
  };
}

const cleanStaleCacheEntries = <T>(
  cache: Record<string, MemoizeCache<T>>,
  ttl: number
) => {
  const now = Date.now();
  const cacheKeys = Object.keys(cache);

  // we want to avoid slowing down
  assertWithLog(
    cacheKeys.length < EXPECTED_MAX_CACHE_ENTRIES_PER_FN,
    `Assumed cache key space will not grow over ${EXPECTED_MAX_CACHE_ENTRIES_PER_FN}`
  );

  for (const key of cacheKeys) {
    if (now - cache[key].lastSet > ttl) {
      delete cache[key];
    }
  }
};
