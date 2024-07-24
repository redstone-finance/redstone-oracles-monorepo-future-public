import { expect } from "chai";
import fs from "fs";
import path from "path";
import { manifests, multiFeedManifests } from "../../src";
import {
  AnyOnChainRelayerManifest,
  AnyOnChainRelayerManifestSchema,
} from "../../src/schemas";

const RELAYER_MANIFESTS_FOLDER = "./relayer-manifests";
const MULTI_FEED_RELAYER_MANIFESTS_FOLDER = "./relayer-manifests-multi-feed";

describe("exported-manifests", () => {
  checkExportedManifests(RELAYER_MANIFESTS_FOLDER, manifests);
});

describe("exported multi-feed-manifests", () => {
  checkExportedManifests(
    MULTI_FEED_RELAYER_MANIFESTS_FOLDER,
    multiFeedManifests
  );
});

function checkExportedManifests(
  directory: string,
  manifestConfig: { [p: string]: AnyOnChainRelayerManifest }
) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    if (path.extname(file) === ".json") {
      const relayerName = path.basename(file, ".json");

      // We run each test in a loop to separate errors for each manifest
      it(`Should properly export ${relayerName} manifest`, () => {
        expect(manifestConfig).to.haveOwnProperty(relayerName);
        const fileContent = fs.readFileSync(path.join(directory, file), "utf8");

        const parsedManifest = AnyOnChainRelayerManifestSchema.parse(
          JSON.parse(fileContent)
        );

        const exportedManifest =
          manifestConfig[relayerName as keyof typeof manifestConfig];

        expect(exportedManifest).to.deep.equal(parsedManifest);
      });
    }
  }
}
