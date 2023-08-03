import { spawn } from "child_process";
import fs from "fs";
import {
  addPrefixToProcessLogs,
  debug,
  runWithLogPrefix,
} from "./integration-test-utils";

export const lazilyInstallNPMDeps = async (cwd: string) => {
  if (fs.existsSync(`${cwd}/node_modules`)) {
    debug(`Node modules are already installed in ${cwd}. Skipping...`);
    return;
  }
  debug(`Installing NPM deps in ${cwd}`);
  const childProcess = spawn("yarn", {
    stdio: ["ignore", "ignore", "pipe"],
    cwd,
  });
  addPrefixToProcessLogs(childProcess, "yarn install");
  await new Promise((resolve) => {
    childProcess.on("close", resolve);
  });
  debug(`Installed NPM deps in ${cwd}`);
};

export const lazilyBuildTypescript = async (cwd: string) => {
  if (fs.existsSync(`${cwd}/dist`)) {
    debug(`Already built ${cwd}. Skipping...`);
  } else {
    debug(`Building typescript in ${cwd}`);
    const result = spawn("yarn", ["build"], {
      stdio: ["ignore", "ignore", "pipe"],
      cwd,
    });
    addPrefixToProcessLogs(result, `yarn build ${cwd}`);
    await new Promise((resolve) => {
      result.on("close", resolve);
    });
    debug(`Building completed ${cwd}`);
  }
};

export const compileContracts = async (cwd: string) => {
  return await runWithLogPrefix(
    "yarn",
    ["compile"],
    `compile contracts ${cwd}`,
    cwd
  );
};

export const installAndBuild = async (cwd: string, buildContracts: boolean) => {
  await lazilyInstallNPMDeps(cwd);
  if (buildContracts) {
    await compileContracts(cwd);
  }
  await lazilyBuildTypescript(cwd);
};
