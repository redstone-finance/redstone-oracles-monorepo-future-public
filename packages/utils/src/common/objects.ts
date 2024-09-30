/**
 * if objects share keys the last value of the key is used in result
 */
export function mergeObjects<T = unknown>(objects: T[]) {
  return Object.assign({}, ...objects) as T;
}

export function getRequiredPropValue<T = unknown>(
  obj: { [x: string]: unknown },
  prop: string
): T {
  if (obj[prop] === undefined) {
    throw new Error(
      `Object does not contain required property "${prop}". Obj: ` +
        JSON.stringify(obj)
    );
  }

  return obj[prop] as T;
}

export function isDefined(value: unknown) {
  return value !== null && value !== undefined;
}

export const ensureInitialized = <T>(
  o: Partial<Record<string, T>>,
  key: string,
  initializer: () => T
): o is Record<string, T> => {
  if (!(key in o)) {
    o[key] = initializer();
  }
  return true;
};

export const createEmptySet = <T>(): Set<T> => new Set();
