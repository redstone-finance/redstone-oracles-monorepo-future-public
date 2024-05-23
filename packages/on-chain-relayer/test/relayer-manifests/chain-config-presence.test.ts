import { getChainConfigByChainId } from "@redstone-finance/rpc-providers";
import { describe, test } from "mocha";
import { manifests } from "../../src";

describe("Chain config presence", () => {
  test("There should be a chain config for each chain used in relayer manifests", () => {
    for (const manifest of Object.values(manifests)) {
      // Hubble chain is shutting down, skip it's chains till we remove hubble relayers
      if (
        manifest.chain.id === 1992 ||
        manifest.chain.id === 486 ||
        manifest.chain.id === 321123
      ) {
        continue;
      }
      getChainConfigByChainId(manifest.chain.id);
    }
  });
});
