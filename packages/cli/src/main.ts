import prompts from "prompts";
import { printRedstoneOracleRegistryState } from "./print-redstone-oracle-registry-state";
import { registerDataFeed } from "./register-data-feed";
import { registerRedstoneNode } from "./register-redstone-node";
import { updateDataFeedManifest } from "./update-data-feed-manifest";
import { updateRedstoneNode } from "./update-redstone-node";
import { uploadManifest } from "./upload-manifest";

(async () => {
  const response = await prompts({
    type: "select",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { title: "Print redstone oracle registry state", value: "printState" },
      { title: "Upload manifest", value: "uploadManifest" },
      { title: "Register data feed", value: "registerDataFeed" },
      { title: "Update data feed manifest", value: "updateDataFeedManifest" },
      { title: "Register redstone node", value: "registerNode" },
      { title: "Update redstone node", value: "updateNode" },
    ],
    initial: 0,
  });

  switch (response.action) {
    case "printState":
      return printRedstoneOracleRegistryState();
    case "uploadManifest":
      return uploadManifest();
    case "registerDataFeed":
      return registerDataFeed();
    case "updateDataFeedManifest":
      return updateDataFeedManifest();
    case "registerNode":
      return registerRedstoneNode();
    case "updateNode":
      return updateRedstoneNode();
  }
})();
