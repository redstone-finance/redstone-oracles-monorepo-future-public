export interface DataPackageFromGatewayResponse {
  [dataPackageId: string]: DataPackageFromGateway[] | undefined;
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
  dataPackageId: string;
  isSignatureValid: boolean;
  signerAddress: string;
}
