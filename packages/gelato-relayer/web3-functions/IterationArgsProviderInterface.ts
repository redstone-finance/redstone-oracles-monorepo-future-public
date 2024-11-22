export type IterationArgs<Args> = {
  shouldUpdatePrices: boolean;
  args?: Args;
  message?: string;
};

export type IterationArgsProviderEnv = {
  manifestUrls: string[];
  historicalPackagesGateways?: string[];
  fallbackOffsetInMilliseconds: number;
  fallbackSkipDeviationBasedFrequentUpdates: boolean;
  localManifestData?: unknown;
};
