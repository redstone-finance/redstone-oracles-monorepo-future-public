import { SupportedNetworkNames } from ".";

export function mapNetworkNameToGeckoTerminalNetworkName(
  networkName: SupportedNetworkNames
): string | undefined {
  // https://api.geckoterminal.com/api/v2/networks?page=1'
  switch (networkName) {
    case "ethereum":
      return "eth";
    case "arbitrumOne":
      return "arbitrum";
    case "avalanche":
      return "avax";
    case "optimism":
      return "optimism";
    case "canto":
      return "canto";
    case "base":
      return "base";
    case "bnb":
      return "bsc";
    default:
      return undefined;
  }
}
