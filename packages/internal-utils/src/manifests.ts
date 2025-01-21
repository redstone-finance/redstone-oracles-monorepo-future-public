export interface AllManifests {
  standard: Manifests;
  multifeed: Manifests;
  nonEvm: Manifests;
}

export type Manifests = Record<
  string,
  {
    createdAt?: number;
    updatedAt?: number;
    version?: number;
  }
>;

export const DEFAULT_ALL_RELAYER_MANIFESTS_URL =
  "https://p6s64pjzub.execute-api.eu-west-1.amazonaws.com/dev/execute";
