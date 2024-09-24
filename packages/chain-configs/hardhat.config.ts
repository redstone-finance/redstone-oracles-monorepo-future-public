import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  mocha: {
    timeout: 60_000,
  },
};

export default config;
