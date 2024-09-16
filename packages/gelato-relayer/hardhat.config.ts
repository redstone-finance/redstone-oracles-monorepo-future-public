import { hardhatNetworksConfig } from "@redstone-finance/rpc-providers";
import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";

// ================================= TASKS =========================================
// Process Env Variables
import "dotenv/config";
// Libraries

process.env.DENO_PATH = "./../../node_modules/deno-bin/bin/deno";

// Process Env Variables - an empty ID might lead to a "Must be authorized" error.
const ALCHEMY_ID = process.env.ALCHEMY_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

// ================================= CONFIG =========================================
const config: HardhatUserConfig = {
  w3f: {
    rootDir: "./web3-functions",
    debug: true,
    networks: ["sepolia"], //(multiChainProvider) injects provider for these networks
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },

  defaultNetwork: "sepolia",

  networks: {
    ...hardhatNetworksConfig(PRIVATE_KEY ? [PRIVATE_KEY] : []),
    hardhat: {
      forking: {
        url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_ID}`,
        blockNumber: 8664000,
      },
    },
  },

  verify: {
    etherscan: {
      apiKey: ETHERSCAN_KEY ?? "",
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: { enabled: true },
        },
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
