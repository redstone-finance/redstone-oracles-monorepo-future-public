import { SuiNetworkName } from "./config";

/// A numeric result of invoking SuiClient.getChainIdentifier method
/// same as for `sui_getChainIdentifier` API method
export const SUI_NETWORK_IDS: { [p: number]: SuiNetworkName } = {
  897796746: "mainnet",
  1282977196: "testnet",
  2139214974: "devnet",
};

export function getSuiNetworkName(chainId: number): SuiNetworkName {
  return SUI_NETWORK_IDS[chainId] ?? "localnet";
}
