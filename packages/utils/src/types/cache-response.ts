export interface DataPackageFromGatewayResponse {
  [dataFeedId: string]: DataPackageFromGateway[];
}

export interface DataPackageFromGateway {
  timestampMilliseconds: number;
  signature: string;
  dataPoints: {
    dataFeedId: string;
    value: number;
    metadata: Record<string, unknown>;
  }[];
  dataServiceId: string;
  dataFeedId: string;
  isSignatureValid: boolean;
  signerAddress: string;
}
