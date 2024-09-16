import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
import { hardhatNetworksConfig } from "./src/hardhat-network-configs";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  mocha: {
    timeout: 30_000,
  },
  networks: {
    ...hardhatNetworksConfig(),
  },
};

export default config;
