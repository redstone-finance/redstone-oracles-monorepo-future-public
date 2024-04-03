import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-viem";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.14",
  mocha: {
    timeout: 20_000,
  },
};

export default config;
