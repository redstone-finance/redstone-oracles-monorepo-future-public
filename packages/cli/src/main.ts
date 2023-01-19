import prompts from "prompts";
import { printRedstoneOracleRegistryState } from "./print-redstone-oracle-registry-state";
import { registerDataService } from "./register-data-service";
import { registerRedstoneNode } from "./register-redstone-node";
import { updateDataServiceManifest } from "./update-data-service-manifest";
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
      { title: "Register data feed", value: "registerDataService" },
      {
        title: "Update data feed manifest",
        value: "updateDataServiceManifest",
      },
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
    case "registerDataService":
      return registerDataService();
    case "updateDataServiceManifest":
      return updateDataServiceManifest();
    case "registerNode":
      return registerRedstoneNode();
    case "updateNode":
      return updateRedstoneNode();
  }
})();
