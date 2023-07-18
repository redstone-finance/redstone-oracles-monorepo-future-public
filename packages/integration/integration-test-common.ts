import { ChildProcess, spawn, spawnSync } from "child_process";
import * as fs from "fs";

export const stop = (childProcess: ChildProcess | undefined, name: string) => {
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

export const printDotenv = (label: string) => {
  console.group(`${label} .env`);
  console.log(fs.readFileSync(".env", "utf-8"));
  console.groupEnd();
};

export const lazilyInstallNPMDeps = async () => {
  if (fs.existsSync("node_modules")) {
    console.log("Node modules are already installed. Skipping...");
  } else {
    console.log("Installing NPM deps");
    const childProcess = spawn("yarn", {
      stdio: ["ignore", "ignore", "pipe"],
    });
    addPrefixToProcessLogs(childProcess, "yarn install");
    await new Promise((resolve, _) => {
      childProcess.on("close", resolve);
    });
    console.log("Installed NPM deps");
  }
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
    await new Promise((resolve, reject) => {
      result.on("close", resolve);
    });
    console.log("Building completed");
  }
};

export const installAndBuild = async () => {
  await lazilyInstallNPMDeps();
  await lazilyBuildTypescript();
};

const sleepTimeMilliseconds = 5000;

export const waitForFile = async (filename: string) => {
  while (!fs.existsSync(filename)) {
    console.log(`${filename} is not present, waiting...`);
    await sleep(sleepTimeMilliseconds);
  }
};

export const waitForUrl = async (url: string) => {
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
  while (!await cond()) {
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
  dotenvFileName: string,
  dotenvDest: string
) => {
  const dotenvContents = fs.readFileSync(dotenvFileName, "utf-8");
  const newDotenvContents = dotenvContents.replace(regex, replacement);
  fs.writeFileSync(dotenvDest, newDotenvContents, "utf-8");
};

export const updateDotEnvFile = (varName: string, varValue: string) => {
  copyAndReplace(
    new RegExp(`^${varName}=.*$`, "gm"),
    `${varName}=${varValue}`,
    "./.env",
    "./.env"
  );
};

const addPrefixToProcessLogs = (
  childProcess: ChildProcess,
  logPrefix: string
) => {
  const logPrefixLength = 25;
  const normalizedPrefix = (logPrefix + " ".repeat(logPrefixLength)).substring(
    0,
    logPrefixLength
  );
  const normalizedErrorPrefix = (
    logPrefix +
    " (stderr)" +
    " ".repeat(logPrefixLength)
  ).substring(0, logPrefixLength);
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

export const runWithLogPrefix = async (
  cmd: string,
  args: string[],
  logPrefix: string,
  throwOnError = true
) => {
  const childProcess = spawn(cmd, args);
  addPrefixToProcessLogs(childProcess, logPrefix);
  await new Promise((resolve, _) => {
    childProcess.on("exit", resolve);
  });
  if (throwOnError && childProcess.exitCode !== 0) {
    throw new Error(`command ${cmd} ${args} faild`);
  }
  return childProcess.exitCode === 0;
};

export const runWithLogPrefixInBackground = (
  cmd: string,
  args: string[],
  logPrefix: string
) => {
  const childProcess = spawn(cmd, args);
  addPrefixToProcessLogs(childProcess, logPrefix);
  return childProcess;
};

export const waitForDataPackages = async (
  expectedDataPackageCount: number,
  feedId: string
) => {
  await runWithLogPrefix(
    "yarn",
    [
      "run-ts",
      "scripts/wait-for-data-packages.ts",
      `${expectedDataPackageCount}`,
      `${feedId}`,
    ],
    `Waiting ${feedId}`
  );
};

const mongoUriFile = "./tmp-mongo-db-uri.log";
const cacheServiceUrl = "http://localhost:3000";
const hardhatMockPrivateKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let mongoDbProcess: ChildProcess | undefined = undefined;
let cacheServiceProcess: ChildProcess | undefined = undefined;
let oracleNodeProcess: ChildProcess | undefined = undefined;

export const startAndWaitForCacheLayer = async () => {
  process.chdir("../cache-service");
  await installAndBuild();

  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  mongoDbProcess = runWithLogPrefixInBackground(
    "yarn",
    ["run-ts", "scripts/launch-mongodb-in-memory.ts"],
    "mongo-db"
  );
  await waitForFile(mongoUriFile);
  const memoryMongoDbUrl = fs.readFileSync(mongoUriFile, "utf-8");

  // Run cache layer
  fs.copyFileSync(".env.example", ".env");
  updateDotEnvFile("MONGO_DB_URL", memoryMongoDbUrl);
  updateDotEnvFile("API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES", "hehe");
  updateDotEnvFile("ENABLE_DIRECT_POSTING_ROUTES", "true");
  updateDotEnvFile("ENABLE_STREAMR_LISTENING", "false");
  updateDotEnvFile("USE_MOCK_ORACLE_STATE", "true");
  printDotenv("cache service");
  cacheServiceProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start:prod"],
    "cache-service"
  );
  await waitForUrl(cacheServiceUrl);
};

export const startAndWaitForOracleNode = async () => {
  // Launching one iteration of oracle-node
  process.chdir("../oracle-node");
  await installAndBuild();
  fs.copyFileSync(".env.example", ".env");
  updateDotEnvFile(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    '["http://localhost:3000"]'
  );
  updateDotEnvFile(
    "OVERRIDE_MANIFEST_USING_FILE",
    "./manifests/single-source/mock.json"
  );
  updateDotEnvFile("ECDSA_PRIVATE_KEY", hardhatMockPrivateKey);
  printDotenv("oracle node");
  oracleNodeProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start"],
    "oracle-node"
  );
};

export const stopCacheLayer = () => {
  stop(cacheServiceProcess, "cache service");
  cacheServiceProcess = undefined;
  stop(mongoDbProcess, "mongo");
  mongoDbProcess = undefined;
};

export const stopOracleNode = () => {
  stop(oracleNodeProcess, "oracle node");
  oracleNodeProcess = undefined;
};

export const waitForDataAndDisplayIt = async () => {
  // Waiting for data packages to be available in cache service
  process.chdir("../cache-service");
  await waitForDataPackages(1, "___ALL_FEEDS___");
  await waitForDataPackages(1, "ETH");
  await waitForDataPackages(1, "BTC");
  await waitForDataPackages(1, "AAVE");

  // Querying data packages from cache service
  await runWithLogPrefix(
    "curl",
    ["http://localhost:3000/data-packages/latest/mock-data-service"],
    "fetch packages"
  );
};

export const buildEvmConnector = async () => {
  process.chdir("../evm-connector");
  await lazilyInstallNPMDeps();
  await runWithLogPrefix("yarn", ["compile"], "compile evm connector");
  await lazilyBuildTypescript();
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

  process.on("uncaughtException", (error, _) => {
    console.log("exiting due to uncaught exception", error);
    process.exit(-1);
  });
};
