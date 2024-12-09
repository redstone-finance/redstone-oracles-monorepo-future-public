import { copyFileSync, cpSync } from "fs";
import { resolve } from "path";

const copyContractsTemplates = () => {
  const contractsPath = resolve(__dirname, "../", "contracts/templates");
  cpSync(contractsPath, "contracts/templates", {
    recursive: true,
    force: true,
  });
};

const copyHardhatConfig = () => {
  const hardhatConfigPath = `${__dirname}/hardhat.config.js`;
  copyFileSync(hardhatConfigPath, "hardhat.config.js");
};

const copyHardhatScripts = () => {
  const contractsPath = resolve(__dirname, "scripts");
  cpSync(contractsPath, "scripts", {
    recursive: true,
    force: true,
  });
};

export const init = () => {
  try {
    if (!__dirname.includes("dist")) {
      console.log("You are in dev env, init shouldn't be needed");
    } else {
      console.log("RedStone CLI initialization...");
      copyContractsTemplates();
      copyHardhatConfig();
      copyHardhatScripts();
      console.log("Initialization finished");
    }
  } catch {
    console.error("There is a problem with initialization, exiting...");
    process.exit(1);
  }
};
