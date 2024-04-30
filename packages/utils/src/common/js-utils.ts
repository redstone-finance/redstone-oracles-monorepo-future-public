/**
 * Will throw error on access of NOT defined properties
 */
export const toSafeRecord = <V, R extends Record<string | number, V>>(
  record: R,
  errorFn: (property: string | number) => Error
): Required<R> =>
  new Proxy(record, {
    get: (target, p: string) => {
      // this are properties which JS runtime checks internally
      if (p === "then" || p === "toJSON") {
        return target[p];
      } else if (!Reflect.has(target, p) || target[p] === undefined) {
        throw errorFn(p);
      }
      return target[p];
    },
  }) as Required<R>;

export type PromisifiedRecord<T> = {
  [t in keyof T]: Promise<T[t]>;
};

export const waitForAllRecord = async <T>(
  s: PromisifiedRecord<T>
): Promise<T> => {
  const keys = Object.keys(s) as [keyof T];
  const promises = keys.map((k) => s[k]);
  const results = await Promise.all(promises);
  const result = {} as T;
  for (let i = 0; i < keys.length; ++i) {
    result[keys[i]] = results[i];
  }
  return result;
};
