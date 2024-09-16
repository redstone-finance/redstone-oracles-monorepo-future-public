import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-viem";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  mocha: {
    timeout: 20_000,
  },
};

export default config;
