import { z } from "zod";

export const ChainConfigSchema = z.object({
  chainId: z.number().positive(),
  name: z.string(),
  publicRpcUrls: z.string().url().array().readonly(),
  avgBlockTimeMs: z.number(),
});

export type ChainConfig = z.infer<typeof ChainConfigSchema>;

export const ChainConfigs = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    publicRpcUrls: [
      "https://rpc.ankr.com/eth",
      "https://eth.llamarpc.com",
      "https://eth-mainnet.public.blastapi.io",
      "https://endpoints.omniatech.io/v1/eth/mainnet/public",
      "https://ethereum.publicnode.com",
    ],
    avgBlockTimeMs: 12_000,
  },
  arbitrumOne: {
    name: "Arbitrum One",
    chainId: 42161,
    publicRpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one.publicnode.com",
      "https://arbitrum-one.public.blastapi.io",
      "https://arbitrum.llamarpc.com",
      "https://1rpc.io/arb",
    ],
    avgBlockTimeMs: 250,
  },
  avalanche: {
    name: "Avalanche Network",
    chainId: 43114,
    publicRpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche.blockpi.network/v1/rpc/public",
      "https://avax.meowrpc.com",
      "https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc",
      "https://avalanche-c-chain.publicnode.com",
    ],
    avgBlockTimeMs: 2_000,
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    publicRpcUrls: [
      "https://mainnet.optimism.io",
      "https://optimism.publicnode.com",
      "https://optimism-mainnet.public.blastapi.io",
      "https://rpc.ankr.com/optimism",
      "https://1rpc.io/op",
      "https://optimism.blockpi.network/v1/rpc/public",
    ],
    avgBlockTimeMs: 2_000,
  },
  polygon: {
    name: "Polygon Mainnet",
    chainId: 137,
    publicRpcUrls: [
      "https://polygon.llamarpc.com",
      "https://polygon.blockpi.network/v1/rpc/public",
      "https://polygon-mainnet.public.blastapi.io",
      "https://polygon.rpc.blxrbdn.com",
      "https://rpc-mainnet.matic.quiknode.pro",
    ],
    avgBlockTimeMs: 2_000,
  },
  celo: {
    name: "Celo Mainnet",
    chainId: 42220,
    publicRpcUrls: ["https://forno.celo.org"],
    avgBlockTimeMs: 5_000,
  },
  base: {
    name: "Base Mainnet",
    chainId: 8453,
    publicRpcUrls: [
      "https://base.llamarpc.com",
      "https://base.publicnode.com",
      "https://base-mainnet.public.blastapi.io",
      "https://mainnet.base.org",
    ],
    avgBlockTimeMs: 5_000,
  },
  canto: {
    name: "Canto",
    chainId: 7700,
    publicRpcUrls: [
      "https://canto.slingshot.finance",
      "https://canto.gravitychain.io",
      "https://mainnode.plexnode.org:8545",
    ],
    avgBlockTimeMs: 6_000,
  },
  manta: {
    name: "Manta Pacific Mainnet",
    chainId: 169,
    publicRpcUrls: [
      "https://pacific-rpc.manta.network/http",
      "https://1rpc.io/manta",
      "https://manta-pacific-aperture.calderachain.xyz/http",
      "https://manta-pacific-gascap.calderachain.xyz/http",
    ],
    avgBlockTimeMs: 10_000,
  },
};
