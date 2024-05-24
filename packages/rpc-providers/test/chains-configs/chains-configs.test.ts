import chai from "chai";
import { providers } from "ethers";
import { describe, test } from "mocha";
import { z } from "zod";
import {
  ChainConfigSchema,
  ChainConfigs,
  MegaProviderBuilder,
  REDSTONE_MULTICALL3_ADDRESS,
  STANDARD_MULTICALL3_ADDRESS,
} from "../../src";

const SINGLE_RPC_TIMEOUT_MILLISECONDS = 10_000;

function createProvider(
  chainId: number,
  rpcUrls: string[]
): providers.Provider {
  return new MegaProviderBuilder({
    timeout: SINGLE_RPC_TIMEOUT_MILLISECONDS,
    throttleLimit: 1,
    network: { name: `name-${chainId}`, chainId },
    rpcUrls,
  })
    .fallback(
      {
        singleProviderOperationTimeout: SINGLE_RPC_TIMEOUT_MILLISECONDS,
      },
      rpcUrls.length > 1
    )
    .build();
}

describe("Validate chains configs", () => {
  test("Scheme should be valid", () => {
    z.record(ChainConfigSchema).parse(ChainConfigs);
  });

  test("Each chains config should have at least one publicRpcProvider", () => {
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
      if (chainConfig.multicall3.type === "Multicall3") {
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
      chainConfig.publicRpcUrls[0].includes("localhost")
    ) {
      continue;
    }

    test(`Chains config for chain ${chainConfig.name} (${chainConfig.chainId}) should have a valid multicall3 address`, async function () {
      // Hubble chain is shutting down, skip it's chains till we remove hubble relayers
      if (
        chainConfig.chainId === 1992 ||
        chainConfig.chainId === 486 ||
        chainConfig.chainId === 321123
      ) {
        this.skip();
      }
      if (process.env.IS_CI !== "true") {
        this.skip();
      }
      const provider = createProvider(
        chainConfig.chainId,
        chainConfig.publicRpcUrls
      );

      const multicallCode = await provider.getCode(
        chainConfig.multicall3.address
      );

      chai
        .expect(multicallCode.length, "Multicall implementation missing")
        .greaterThan(2);
    });
  }
});
