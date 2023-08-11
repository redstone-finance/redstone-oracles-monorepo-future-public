export interface DataPackageFromCacheResponse {
  [dataFeedId: string]: DataPackageFromCache[];
}

export interface DataPackageFromCache {
  timestampMilliseconds: number;
  signature: string;
  dataPoints: [
    {
      dataFeedId: string;
      value: number;
      metadata: any;
    }
  ];
  dataServiceId: string;
  dataFeedId: string;
  isSignatureValid: boolean;
  signerAddress: string;
}
