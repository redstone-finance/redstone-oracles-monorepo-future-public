import { RedstoneCommon } from "@redstone-finance/utils";
import chai from "chai";
import { providers } from "ethers";
import { z } from "zod";
import {
  ChainConfigSchema,
  getLocalChainConfigs,
  REDSTONE_MULTICALL3_ADDRESS,
  STANDARD_MULTICALL3_ADDRESS,
} from "../src";

const RETRY_CONFIG = {
  maxRetries: 4,
  waitBetweenMs: 1000,
  disableLog: true,
};
const ChainConfigs = getLocalChainConfigs();

const chainToSkipForMulticallAddressCheck = [
  "zkSync",
  "zkLink",
  "Haven1 Testnet",
  "BounceBit Mainnet",
];

describe("Validate chain configs", () => {
  test("Scheme should be valid", () => {
    z.record(ChainConfigSchema).parse(ChainConfigs);
  });

  test("Each chain config should have at least one publicRpcProvider", () => {
    for (const chainConfig of Object.values(ChainConfigs)) {
      chai
        .expect(
          chainConfig.publicRpcUrls.length,
          `No publicRpcProvider set for ${chainConfig.name}`
        )
        .greaterThanOrEqual(1);
    }
  });
});

describe("Validate multicall3", () => {
  test(`Each redstone multicall3 should have the same address`, function () {
    for (const chainConfig of Object.values(ChainConfigs)) {
      if (chainConfig.multicall3.type === "RedstoneMulticall3") {
        chai
          .expect(
            chainConfig.multicall3.address,
            `Multicall3 address for chain ${chainConfig.name} doesn't match REDSTONE_MULTICALL3_ADDRESS`
          )
          .eq(REDSTONE_MULTICALL3_ADDRESS);
      }
    }
  });

  test(`Each standard multicall3 should have the same address`, function () {
    for (const chainConfig of Object.values(ChainConfigs)) {
      if (
        chainConfig.multicall3.type === "Multicall3" &&
        !chainToSkipForMulticallAddressCheck.includes(chainConfig.name)
      ) {
        chai
          .expect(
            chainConfig.multicall3.address,
            `Multicall3 address for chain ${chainConfig.name} doesn't match STANDARD_MULTICALL3_ADDRESS`
          )
          .eq(STANDARD_MULTICALL3_ADDRESS);
      }
    }
  });

  for (const chainConfig of Object.values(ChainConfigs)) {
    if (
      chainConfig.publicRpcUrls.length === 0 ||
      chainConfig.publicRpcUrls[0].includes("localhost") ||
      chainConfig.name === "BounceBit Mainnet" // In progress
    ) {
      continue;
    }

    test(`Chain config for chain ${chainConfig.name} (${chainConfig.chainId}) should have a valid multicall3 address`, async function () {
      const provider = new providers.StaticJsonRpcProvider(
        chainConfig.publicRpcUrls[0]
      );

      const multicallCode = await RedstoneCommon.retry({
        fn: () => provider.getCode(chainConfig.multicall3.address),
        ...RETRY_CONFIG,
      })();

      chai
        .expect(multicallCode.length, "Multicall implementation missing")
        .greaterThan(2);
    });
  }
});
