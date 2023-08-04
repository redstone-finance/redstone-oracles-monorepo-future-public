type Cache<T> = { promise?: Promise<T>; lastSet: number };

export function memoize<T>(fn: () => Promise<T>, ttl: number) {
  const cache: Cache<T> = { promise: undefined, lastSet: 0 };

  return async () => {
    if (cache.promise === undefined || Date.now() - cache.lastSet > ttl) {
      cache.lastSet = Date.now();
      cache.promise = fn();
    }
    return await cache.promise;
  };
}
