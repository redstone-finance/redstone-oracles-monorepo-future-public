export type CasperNetworkName = "casper" | "casper-test";

export interface CasperConfig {
  keysPath: string;
  nodeUrl: string;
  statusApi: string;
  networkName: CasperNetworkName;
}
