import "dotenv/config";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

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
  mocha: {
    timeout: 300_000, // 300 seconds
  },
  networks: {
    hardhat: {
      blockGasLimit: 30_000_000,
    },
    goerli: {
      url: process.env.GOERLI_URL ?? "https://eth-goerli.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
    },
  },
};

export default config;
