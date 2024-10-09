import { getLocalChainConfigs } from "@redstone-finance/chain-configs";

const ChainConfigs = getLocalChainConfigs();
const chainNames = Object.keys(ChainConfigs);
type ChainName = (typeof chainNames)[number];

const CHAIN_NAME_TO_HARDHAT_NETWORK_NAME: {
  [key: ChainName]: string | undefined;
} = {
  ethereum: "mainnet",
  "ethereum-sepolia": "sepolia",
  "re.al": "real",
  "blast-sepolia": "blast-testnet",
  "bnb-testnet": "bscTestnet",
};

const HARDHAT_NETWORK_NAME_TO_CHAIN_NAME = Object.fromEntries(
  Object.entries(CHAIN_NAME_TO_HARDHAT_NETWORK_NAME).map(([key, value]) => [
    value,
    key,
  ])
) as {
  [key: string]: ChainName | undefined;
};

type NetworkUserConfig = {
  name: string;
  chainId: number;
  url: string;
  etherScanApi?: string;
  accounts: string[];
};

type NetworksUserConfig = { [key: ChainName]: NetworkUserConfig };

export const hardhatNetworksConfig = (
  accounts: string[] = [],
  pickRandom: boolean = false
): NetworksUserConfig => {
  const networks: NetworksUserConfig = {};

  for (const [chainName, config] of Object.entries(ChainConfigs)) {
    if (config.publicRpcUrls.length === 0 || chainName === "hardhat") {
      continue;
    }

    const rpcUrl =
      config.publicRpcUrls[
        (pickRandom ? 1 : 0) *
          Math.floor(Math.random() * config.publicRpcUrls.length)
      ];

    networks[CHAIN_NAME_TO_HARDHAT_NETWORK_NAME[chainName] ?? chainName] = {
      name: config.name,
      chainId: config.chainId,
      url: rpcUrl,
      etherScanApi: config.etherScanApi,
      accounts,
    } as NetworkUserConfig;
  }

  return networks;
};

export function convertHardhatNetworkNameToChainName(
  hardhatNetworkName: string
) {
  return (
    HARDHAT_NETWORK_NAME_TO_CHAIN_NAME[hardhatNetworkName] ?? hardhatNetworkName
  );
}
