import { SupportedNetworkNames } from "@redstone-finance/chain-configs";

const networkNameMappingGecko: { [key in SupportedNetworkNames]?: string } = {
  ethereum: "eth",
  arbitrumOne: "arbitrum",
  avalanche: "avax",
  optimism: "optimism",
  canto: "canto",
  base: "base",
  bnb: "bsc",
  manta: "manta-pacific",
  sei: "sei-evm",
};

export function mapNetworkNameToGeckoTerminalNetworkName(
  networkName: SupportedNetworkNames
): string | undefined {
  return networkNameMappingGecko[networkName];
}

export const allGeckoSupportedNetworkNames: SupportedNetworkNames[] =
  Object.keys(networkNameMappingGecko) as SupportedNetworkNames[];
