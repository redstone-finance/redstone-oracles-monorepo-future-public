import { expect } from "chai";
import fs from "fs";
import path from "path";
import { OnChainRelayerManifestSchema, manifests } from "../../src/";

const RELAYER_MANIFESTS_FOLDER = "./relayer-manifests";

describe("exported-manifests", () => {
  const files = fs.readdirSync(RELAYER_MANIFESTS_FOLDER);
  for (const file of files) {
    if (path.extname(file) === ".json") {
      const relayerName = path.basename(file, ".json");

      // We run each test in a loop to separate errors for each manifest
      it(`Should properly export ${relayerName} manifest`, () => {
        expect(manifests).to.haveOwnProperty(relayerName);
        const fileContent = fs.readFileSync(
          path.join(RELAYER_MANIFESTS_FOLDER, file),
          "utf8"
        );
        const parsedManifest = OnChainRelayerManifestSchema.parse(
          JSON.parse(fileContent)
        );
        const exportedManifest =
          manifests[relayerName as keyof typeof manifests];
        expect(exportedManifest).to.deep.equal(parsedManifest);
      });
    }
  }
});
