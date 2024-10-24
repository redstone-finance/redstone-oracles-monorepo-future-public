import {
  getChainConfigByChainId,
  getLocalChainConfigs,
} from "@redstone-finance/chain-configs";
import { describe, test } from "mocha";
import {
  readClassicManifests,
  readMultiFeedManifests,
} from "../../scripts/read-manifests";

describe("Chain config presence", () => {
  test("There should be a chain config for each chain used in relayer manifests", () => {
    const chainIds: Set<number> = new Set();

    const classicManifests = readClassicManifests();
    for (const manifest of Object.values(classicManifests)) {
      chainIds.add(manifest.chain.id);
    }

    const multiFeedManifestsDir = readMultiFeedManifests();
    for (const manifest of Object.values(multiFeedManifestsDir)) {
      chainIds.add(manifest.chain.id);
    }

    for (const chainId of Array.from(chainIds)) {
      getChainConfigByChainId(getLocalChainConfigs(), chainId);
    }
  });
});
