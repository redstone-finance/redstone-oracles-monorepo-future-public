/**
 * It is not guranteed to work in every case.
 **/
export function cloneClassInstance<T>(instance: T): T {
  return Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.create(Object.getPrototypeOf(instance)),
    instance
  ) as T;
}
