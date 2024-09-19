import { OnChainRelayerManifest } from "@redstone-finance/on-chain-relayer-common";
import { promises, readdirSync } from "fs";
import path from "path";

async function main() {
  const dir = readdirSync("./relayer-manifests");

  const manifestsContent = await Promise.all(
    dir.map((p) =>
      promises
        .readFile(path.join("relayer-manifests", p))
        .then((b) => b.toString())
    )
  );

  const manifests = manifestsContent.map(
    (c) => JSON.parse(c) as OnChainRelayerManifest
  );

  const manifestInfo = manifests.map((m, i) => {
    const priceFeeds = Object.keys(m.priceFeeds).join(",");
    return `
${dir[i].replaceAll(".json", "")}
  - priceFeeds: ${priceFeeds}
  - chain: ${m.chain.name}
  - dataServiceId: ${m.dataServiceId}`;
  });

  console.log(manifestInfo.join("\n"));
  console.log({ count: manifestInfo.length });
}

void main();
