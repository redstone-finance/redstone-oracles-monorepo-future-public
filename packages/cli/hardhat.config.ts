import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/config";
import "./scripts/deploy-multi-feed-adapter";
import "./scripts/deploy-price-feeds";

const getForkInfo = () => {
  if (process.env["FORK"]) {
    return {
      forking: { url: process.env["FORK"] },
    };
  }
  return {};
};

const name =
  process.env.NETWORK_NAME && process.env.NETWORK_NAME !== "hardhat"
    ? process.env.NETWORK_NAME
    : "network";
const rpcUrl = process.env.NETWORK_RPC_URL ?? "";
const accounts = process.env.PRIVATE_KEY
  ? [process.env.PRIVATE_KEY]
  : undefined;

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
  networks: {
    hardhat: {
      ...getForkInfo(),
    },
    [name]: {
      url: rpcUrl,
      accounts,
    },
  },
};

export default config;
