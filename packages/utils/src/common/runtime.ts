export const isNodeRuntime = () =>
  typeof process !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  process.versions != null &&
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  process.versions.node != null;
