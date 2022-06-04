import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      // TODO: check these settings
      // optimizer: {
      //   enabled: true,
      //   runs: 200,
      // },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;
