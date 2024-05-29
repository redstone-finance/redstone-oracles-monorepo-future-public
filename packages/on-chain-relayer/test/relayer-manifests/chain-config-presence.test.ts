import { getChainConfigByChainId } from "@redstone-finance/rpc-providers";
import { describe, test } from "mocha";
import { manifests } from "../../src";

describe("Chain config presence", () => {
  test("There should be a chain config for each chain used in relayer manifests", () => {
    for (const manifest of Object.values(manifests)) {
      getChainConfigByChainId(manifest.chain.id);
    }
  });
});
