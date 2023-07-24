import { spawn } from "child_process";
import fs from "fs";
import {
  addPrefixToProcessLogs,
  runWithLogPrefix,
} from "./integration-test-utils";

export const lazilyInstallNPMDeps = async () => {
  if (fs.existsSync("node_modules")) {
    console.log("Node modules are already installed. Skipping...");
    return;
  }
  console.log("Installing NPM deps");
  const childProcess = spawn("yarn", {
    stdio: ["ignore", "ignore", "pipe"],
  });
  addPrefixToProcessLogs(childProcess, "yarn install");
  await new Promise((resolve) => {
    childProcess.on("close", resolve);
  });
  console.log("Installed NPM deps");
};

export const lazilyBuildTypescript = async () => {
  if (fs.existsSync("dist")) {
    console.log("Already built. Skipping...");
  } else {
    console.log("Building typescript");
    const result = spawn("yarn", ["build"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    addPrefixToProcessLogs(result, "yarn build");
    await new Promise((resolve) => {
      result.on("close", resolve);
    });
    console.log("Building completed");
  }
};

export const installAndBuild = async () => {
  await lazilyInstallNPMDeps();
  await lazilyBuildTypescript();
};

export const buildEvmConnector = async () => {
  process.chdir("../evm-connector");
  await lazilyInstallNPMDeps();
  await runWithLogPrefix("yarn", ["compile"], "compile evm connector");
  await lazilyBuildTypescript();
};
