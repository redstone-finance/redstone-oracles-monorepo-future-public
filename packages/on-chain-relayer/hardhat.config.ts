import "dotenv/config";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000, // it slightly increases gas for contract deployment but decreases for user interactions
      },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  networks: {
    "arbitrum-goerli": {
      url: "https://arbitrum-goerli.public.blastapi.io",
      accounts,
    },
    arbitrum: {
      url: "https://arb1.croswap.com/rpc",
      accounts,
    },
    ethereum: {
      url: "https://eth-mainnet.public.blastapi.io",
      accounts,
    },
    "ethereum-goerli": {
      url: "https://eth-goerli.public.blastapi.io",
      accounts,
    },
    "zk-evm-testnet": {
      url: "https://rpc.public.zkevm-test.net",
      accounts,
    },
    "etherlink-ghostnet": {
      url: "https://node.ghostnet.etherlink.com",
      accounts,
    },
  },
};

export default config;
