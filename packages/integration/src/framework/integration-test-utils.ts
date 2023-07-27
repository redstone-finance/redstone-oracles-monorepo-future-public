import { ChildProcess, spawn, spawnSync } from "child_process";
import fs from "fs";

export type PriceSet = { [token: string]: number };

export const stopChild = (
  childProcess: ChildProcess | undefined,
  name: string
) => {
  if (!childProcess) {
    return;
  }
  console.log(`terminate ${name}`);
  childProcess.on("error", (e) =>
    console.log(`error in process, ${name}: ${e}`)
  );
  if (!childProcess.kill()) {
    console.log(`failed to terminate ${name}`);
  }
};

export const sleep = async (millis: number) => {
  await new Promise((resolve) => setTimeout(resolve, millis));
};

export const printDotenv = (label: string, filePath: string) => {
  console.group(`${label} ${filePath}`);
  console.log(fs.readFileSync(filePath, "utf-8"));
  console.groupEnd();
};

const sleepTimeMilliseconds = 5000;

export const waitForFile = async (filename: string) => {
  while (!fs.existsSync(filename)) {
    console.log(`${filename} is not present, waiting...`);
    await sleep(sleepTimeMilliseconds);
  }
};

export const waitForUrl = async (url: string) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = spawnSync("curl", [url]);
    if (result.status === 0) {
      break;
    }
    console.log(`${url} is not responding, waiting...`);
    await sleep(sleepTimeMilliseconds);
  }
};

export const waitForSuccess = async (
  cond: () => Promise<boolean>,
  count: number,
  errorMessage: string
) => {
  let waitCounter = 0;
  while (!(await cond())) {
    if (++waitCounter < count) {
      await sleep(sleepTimeMilliseconds);
    } else {
      throw new Error(errorMessage);
    }
  }
};

export const copyAndReplace = (
  regex: RegExp,
  replacement: string,
  srcFilePath: string,
  destFilePath: string
) => {
  const dotenvContents = fs.readFileSync(srcFilePath, "utf-8");
  const newDotenvContents = dotenvContents.replace(regex, replacement);
  fs.writeFileSync(destFilePath, newDotenvContents, "utf-8");
  return regex.test(dotenvContents);
};

export const updateDotEnvFile = (
  varName: string,
  varValue: string,
  dotenvFilePath: string
) => {
  const found = copyAndReplace(
    new RegExp(`^${varName}=.*$`, "gm"),
    `${varName}=${varValue}`,
    dotenvFilePath,
    dotenvFilePath
  );
  if (!found) {
    fs.appendFileSync(dotenvFilePath, `${varName}=${varValue}\n`);
  }
};

export const updateManifestFile = (
  varName: string,
  varValue: string,
  manifestFilePath: string
) => {
  copyAndReplace(
    new RegExp(`"${varName}":.*$`, "gm"),
    `"${varName}": ${varValue},`,
    manifestFilePath,
    manifestFilePath
  );
};

const logPrefixLength = 25;
const normalizePrefix = (prefix: string): string =>
  (prefix + " ".repeat(logPrefixLength)).substring(0, logPrefixLength);

export const addPrefixToProcessLogs = (
  childProcess: ChildProcess,
  logPrefix: string
) => {
  const normalizedPrefix = normalizePrefix(logPrefix);
  const normalizedErrorPrefix = normalizePrefix(logPrefix + " (stderr)");
  if (!childProcess.stdout) {
    console.log(`stdout for ${logPrefix} won't be displayed`);
  }
  if (!childProcess.stderr) {
    console.log(`stderr for ${logPrefix} won't be displayed`);
  }
  childProcess.stdout?.on("data", (data: string) => {
    data
      .toString()
      .split("\n")
      .forEach((line) => console.log(`${normalizedPrefix}: ${line}`));
  });
  childProcess.stderr?.on("data", (data: string) =>
    data
      .toString()
      .split("\n")
      .forEach((line) => console.log(`${normalizedErrorPrefix}: ${line}`))
  );
};

type ExtraEnv = { [varName: string]: string };

const extendEnv = (extraEnv?: ExtraEnv): NodeJS.ProcessEnv => {
  return { ...process.env, ...extraEnv };
};

export const runWithLogPrefix = async (
  cmd: string,
  args: string[],
  logPrefix: string,
  extraEnv?: ExtraEnv,
  throwOnError = true
) => {
  const childProcess = spawn(cmd, args, { env: extendEnv(extraEnv) });
  addPrefixToProcessLogs(childProcess, logPrefix);
  await new Promise<void>((resolve) => {
    childProcess.on("exit", resolve);
  });
  if (throwOnError && childProcess.exitCode !== 0) {
    throw new Error(`command ${cmd} ${args} failed`);
  }
  return childProcess.exitCode === 0;
};

export const runWithLogPrefixInBackground = (
  cmd: string,
  args: string[],
  logPrefix: string,
  extraEnv?: ExtraEnv
) => {
  const childProcess = spawn(cmd, args, { env: extendEnv(extraEnv) });
  addPrefixToProcessLogs(childProcess, logPrefix);
  return childProcess;
};

export const configureCleanup = (cleanUp: () => void) => {
  process.on("exit", (code) => {
    console.log(`exiting with code ${code}`);
    cleanUp();
  });

  process.on("signal", (signal) => {
    console.log(`exiting due to the signal ${signal}`);
    process.exit(-1);
  });

  process.on("uncaughtException", (error) => {
    console.log("exiting due to uncaught exception", error);
    process.exit(-1);
  });
};
