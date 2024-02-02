import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  mocha: {
    timeout: 2_000,
  },
  networks: {
    mainnet: {
      url: "https://eth-mainnet.public.blastapi.io",
    },
    arbitrumOne: {
      url: "https://arb1.croswap.com/rpc",
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
    },
  },
};

export default config;
