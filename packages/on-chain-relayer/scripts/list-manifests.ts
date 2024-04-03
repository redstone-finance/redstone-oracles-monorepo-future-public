import { promises, readdirSync } from "fs";
import path from "path";
import { OnChainRelayerManifest } from "../src";

async function main() {
  const dir = readdirSync("./relayer-manifests");

  const manifestsContent = await Promise.all(
    dir.map((p) =>
      promises
        .readFile(path.join("relayer-manifests", p))
        .then((b) => b.toString())
    )
  );

  const manfiests = manifestsContent.map(
    (c) => JSON.parse(c) as OnChainRelayerManifest
  );

  const manfiestInfo = manfiests.map((m, i) => {
    const priceFeeds = Object.keys(m.priceFeeds).join(",");
    return `
${dir[i].replaceAll(".json", "")}
  - priceFeeds: ${priceFeeds}
  - chain: ${m.chain.name}
  - dataServiceId: ${m.dataServiceId}`;
  });

  console.log(manfiestInfo.join("\n"));
  console.log({ count: manfiestInfo.length });
}

void main();
