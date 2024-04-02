import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.14",
  mocha: {
    timeout: 20_000,
  },
};

export default config;
