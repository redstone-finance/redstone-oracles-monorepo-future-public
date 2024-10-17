import { assertWithLog } from "./errors";

type MemoizeCache<T> = { promise: Promise<T>; lastSet: number };
const EXPECTED_MAX_CACHE_ENTRIES_PER_FN = 100_000;
const EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN = 10_000;
const CLEAN_EVERY_N_ITERATION_DEFAULT = 1;

type MemoizeArgs<F extends (...args: unknown[]) => Promise<unknown>> = {
  functionToMemoize: F;
  ttl: number;
  cleanEveryNIteration?: number;
  cacheKeyBuilder?: (...args: Parameters<F>) => string | Promise<string>;
  cacheReporter?: (isMiss: boolean) => void;
};

/**
 * Be default for building cacheKey JSON.stringify function is used, thus order of keys in object matters
 */
export function memoize<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (...args: any[]) => Promise<unknown>,
  R = ReturnType<F>,
>({
  functionToMemoize,
  ttl,
  cacheKeyBuilder = (...args: unknown[]) => JSON.stringify(args),
  cacheReporter = () => {},
  cleanEveryNIteration = CLEAN_EVERY_N_ITERATION_DEFAULT,
}: MemoizeArgs<F>): F {
  const cache: Partial<Record<string, MemoizeCache<R>>> = {};
  let iterationCounter = 0;

  return (async (...args: Parameters<F>) => {
    const cacheKey = await cacheKeyBuilder(...args);

    assertWithLog(
      cacheKey.length < EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN,
      `Assumed cache key will not be longer than ${EXPECTED_MAX_CACHE_KEY_LENGTH_PER_FN}. Suspicious key ${cacheKey}`
    );

    // to avoid caching results forever
    iterationCounter = (iterationCounter + 1) % cleanEveryNIteration;
    if (iterationCounter == 0) {
      cleanStaleCacheEntries(cache, ttl);
    }

    // we don't check ttl because it is cleared here: cleanStaleCacheEntries
    const isMiss =
      !cache[cacheKey] || Date.now() - cache[cacheKey].lastSet > ttl;

    if (isMiss) {
      cache[cacheKey] = {
        lastSet: Date.now(),
        promise: functionToMemoize(...args).catch((err: unknown) => {
          // don't propagate cache when promise resolves to error
          delete cache[cacheKey];
          throw err;
        }) as Promise<R>,
      };
    }

    cacheReporter(isMiss);

    return await cache[cacheKey]!.promise;
  }) as F;
}

const cleanStaleCacheEntries = <T>(
  cache: Partial<Record<string, MemoizeCache<T>>>,
  ttl: number
) => {
  const now = Date.now();
  const cacheKeys = Object.keys(cache);

  // we want to avoid slowing down
  assertWithLog(
    cacheKeys.length < EXPECTED_MAX_CACHE_ENTRIES_PER_FN,
    `Assumed cache key space will not grow over ${EXPECTED_MAX_CACHE_ENTRIES_PER_FN} but is ${cacheKeys.length}`
  );

  for (const key of cacheKeys) {
    if (now - cache[key]!.lastSet > ttl) {
      delete cache[key];
    }
  }
};
