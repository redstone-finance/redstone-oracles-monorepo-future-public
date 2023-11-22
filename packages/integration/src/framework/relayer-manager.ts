import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { OnChainRelayerManifest } from "@redstone-finance/on-chain-relayer";
import {
  PriceFeedsAdapterWithRoundsOneSignerMock,
  PriceFeedWithRoundsMock,
} from "@redstone-finance/on-chain-relayer/typechain-types";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { ChildProcess } from "child_process";
import { BigNumber, ethers } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import fs from "fs";
import {
  fetchDataPackages,
  GatewayInstance,
  getCacheServicePort,
} from "./gateway-manager";
import {
  debug,
  PriceSet,
  printDotenv,
  printExtraEnv,
  runWithLogPrefixInBackground,
  stopChild,
  waitForSuccess,
} from "./integration-test-utils";

const HARDHAT_MOCK_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RELAYER_DIR = "../on-chain-relayer";
const MANIFEST_PATH = "../integration/relayerManifest.json";

export type RelayerInstance = {
  relayerProcess?: ChildProcess;
  instanceId: string;
};

const getLogPrefix = (instance: RelayerInstance) =>
  `relayer-${instance.instanceId}`;

type RelayerConfig = {
  isFallback: boolean;
  adapterContractAddress: string;
  cacheServiceInstances: GatewayInstance[];
  intervalInMs?: number;
  updateTriggers?: {
    cron?: string[];
    deviationPercentage?: number;
    timeSinceLastUpdateInMilliseconds?: number;
  };
  rpcUrls?: string[];
};

export const startRelayer = (
  instance: RelayerInstance,
  config: RelayerConfig
) => {
  const dotenvPath = `${RELAYER_DIR}/.env.example`;
  const cacheServiceUrls = config.cacheServiceInstances.map(
    (gatewayInstance) =>
      `http://localhost:${getCacheServicePort(gatewayInstance, "any")}`
  );
  const rpcUrls = config.rpcUrls ?? ["http://127.0.0.1:8545"];
  createManifestFile({
    adapterContract: config.adapterContractAddress,
    updateTriggers: config.updateTriggers,
  });
  const extraEnv: Record<string, string> = {
    RPC_URLS: JSON.stringify(rpcUrls),
    PRIVATE_KEY: HARDHAT_MOCK_PRIVATE_KEY,
    CACHE_SERVICE_URLS: JSON.stringify(cacheServiceUrls),
    HEALTHCHECK_PING_URL: "",
    MANIFEST_FILE: MANIFEST_PATH,
    FALLBACK_OFFSET_IN_MINUTES: `${config.isFallback ? 2 : 0}`,
    HISTORICAL_PACKAGES_DATA_SERVICE_ID: "mock-data-service",
    HISTORICAL_PACKAGES_GATEWAYS: JSON.stringify(cacheServiceUrls),
  };
  if (config.intervalInMs) {
    extraEnv["RELAYER_ITERATION_INTERVAL"] = config.intervalInMs.toString();
  }
  printDotenv(getLogPrefix(instance), dotenvPath);
  printExtraEnv(getLogPrefix(instance), extraEnv);

  instance.relayerProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/src/run-relayer"],
    getLogPrefix(instance),
    RELAYER_DIR,
    {
      ...extraEnv,
      DOTENV_CONFIG_PATH: dotenvPath,
    }
  );
};

export const stopRelayer = (instance: RelayerInstance) =>
  stopChild(instance.relayerProcess, getLogPrefix(instance));

const waitForPricesInAdapterCheck = async (
  adapterContract: PriceFeedsAdapterWithRoundsOneSignerMock,
  expectedPrices: PriceSet
): Promise<boolean> => {
  try {
    console.log(`Checking prices in adapter ${adapterContract.address}`);

    const bytes32Symbols = Object.keys(expectedPrices).map(formatBytes32String);
    const oracleValues =
      await adapterContract.getValuesForDataFeeds(bytes32Symbols);

    let oracleValuesIndex = 0;
    for (const symbol of Object.keys(expectedPrices)) {
      const expectedPrice = expectedPrices[symbol] * 10 ** 8;
      if (!BigNumber.from(expectedPrice).eq(oracleValues[oracleValuesIndex])) {
        throw new Error(
          `${symbol}: price in adapter(${oracleValues[
            oracleValuesIndex
          ].toString()}) doesn't match with expected price (${expectedPrice})`
        );
      }
      oracleValuesIndex++;
    }
    return true;
  } catch (e) {
    const error = e as Error;
    console.log(error.message);
    return false;
  }
};

const waitForPricesInPriceFeedCheck = async (
  priceFeedContract: PriceFeedWithRoundsMock,
  expectedPrices: PriceSet
): Promise<boolean> => {
  try {
    console.log(`Checking price in feed ${priceFeedContract.address}`);

    const dataFeedId = ethers.utils.parseBytes32String(
      await priceFeedContract.getDataFeedId()
    );
    const lastPrice = await priceFeedContract.latestRoundData();
    const decimals = await priceFeedContract.decimals();

    if (!expectedPrices[dataFeedId]) {
      throw new Error(
        `Price feed contract does not provide dataFeedId=${dataFeedId}`
      );
    }

    const expectedPrice = BigNumber.from(10)
      .pow(decimals)
      .mul(expectedPrices[dataFeedId]);

    if (!lastPrice.answer.eq(expectedPrice)) {
      throw new Error(
        `Price in feed adapter ${lastPrice.answer.toString()} != expectedPrice ${expectedPrice.toString()}`
      );
    }

    return true;
  } catch (e) {
    const error = e as Error;
    console.log(error.message);
    return false;
  }
};

export const verifyPricesOnChain = async (
  adapterContract: PriceFeedsAdapterWithRoundsOneSignerMock,
  priceFeedContract: PriceFeedWithRoundsMock,
  expectedPrices: PriceSet
) => {
  await Promise.all([
    waitForSuccess(
      () => waitForPricesInAdapterCheck(adapterContract, expectedPrices),
      5,
      "couldn't find prices in adapter"
    ),
    waitForSuccess(
      () => waitForPricesInPriceFeedCheck(priceFeedContract, expectedPrices),
      5,
      "couldn't find prices in price feed"
    ),
  ]);
};

export const verifyPricesNotOnChain = async (
  adapterContract: PriceFeedsAdapterWithRoundsOneSignerMock,
  priceFeedContract: PriceFeedWithRoundsMock,
  expectedPrices: PriceSet
) => {
  let exceptionOccurred = false;
  try {
    await verifyPricesOnChain(
      adapterContract,
      priceFeedContract,
      expectedPrices
    );
  } catch (e) {
    exceptionOccurred = true;
  }
  if (!exceptionOccurred) {
    throw new Error(
      "IMPOSSIBLE: prices were updated even though not expected. Most probably there is a bug in testing code."
    );
  }
};

export const deployMockAdapter = async (
  rpcUrl?: string
): Promise<PriceFeedsAdapterWithRoundsOneSignerMock> => {
  const adapterContractDeployment = await import(
    "@redstone-finance/on-chain-relayer/artifacts/contracts/mocks/PriceFeedsAdapterWithRoundsOneSignerMock.sol/PriceFeedsAdapterWithRoundsOneSignerMock.json"
  );

  const signer = getConnectedSigner(rpcUrl);

  const factory = ethers.ContractFactory.fromSolidity(
    adapterContractDeployment,
    signer
  );

  const contract =
    (await factory.deploy()) as PriceFeedsAdapterWithRoundsOneSignerMock;
  return contract;
};

export const deployMockPriceFeed = async (
  adapterAddress: string,
  rpcUrl?: string
): Promise<PriceFeedWithRoundsMock> => {
  const adapterContractDeployment = await import(
    "@redstone-finance/on-chain-relayer/artifacts/contracts/mocks/PriceFeedWithRoundsMock.sol/PriceFeedWithRoundsMock.json"
  );

  const signer = getConnectedSigner(rpcUrl);

  const factory = ethers.ContractFactory.fromSolidity(
    adapterContractDeployment,
    signer
  );

  const contract = (await factory.deploy()) as PriceFeedWithRoundsMock;
  const tx = await contract.setAdapterAddress(adapterAddress);
  await tx.wait();

  return contract;
};

export const getConnectedSigner = (rpcUrl = "http://127.0.0.1:8545") => {
  const wallet = new ethers.Wallet(HARDHAT_MOCK_PRIVATE_KEY);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return wallet.connect(provider);
};

const createManifestFile = (
  manifestConfig: Partial<OnChainRelayerManifest>,
  path: string = MANIFEST_PATH
): void => {
  const sampleManifest = JSON.parse(
    fs.readFileSync("../integration/relayerManifestSample.json").toString()
  ) as Partial<OnChainRelayerManifest>;

  // prevent from overwriting with undefined
  if (!manifestConfig.updateTriggers) {
    manifestConfig.updateTriggers = sampleManifest.updateTriggers;
  }

  const manifest = { ...sampleManifest, ...manifestConfig };
  fs.writeFileSync(path, JSON.stringify(manifest));
};

export const waitForRelayerIterations = (
  relayerInstance: RelayerInstance,
  iterationsCount: number
): Promise<void> =>
  RedstoneCommon.timeout(
    new Promise((resolve, _reject) => {
      let count = 0;
      relayerInstance.relayerProcess?.stdout?.on("data", (log: string) => {
        if (log.includes("Update condition")) {
          if (++count >= iterationsCount) {
            resolve();
          }
        }
      });
    }),
    // it should normally occur in time defined in relayerSampleManifest.json which is set to ~10s
    120_000,
    "Failed to wait for relayer iteration. (Maybe log message has changed)"
  );

export const updateValuesInAdapterContract = async (
  contract: PriceFeedsAdapterWithRoundsOneSignerMock,
  signedDataPackages: DataPackagesResponse
) => {
  debug(
    `manual prices update in ${contract.address}. New prices ${JSON.stringify(
      signedDataPackages
    )}`
  );
  const wrappedContract =
    WrapperBuilder.wrap(contract).usingDataPackages(signedDataPackages);

  const dataPackageTimestamp =
    Object.values(signedDataPackages)[0]![0].dataPackage.timestampMilliseconds;

  const updateTransaction = await wrappedContract.updateDataFeedsValues(
    dataPackageTimestamp,
    { gasLimit: 10_000_000 }
  );

  await updateTransaction.wait();
};

export const deployMockAdapterAndSetInitialPrices = async (
  initialPricesCacheInstances: GatewayInstance[],
  rpcUrl?: string
) => {
  const adapterContract = await deployMockAdapter(rpcUrl);
  const currentPrices = await fetchDataPackages(initialPricesCacheInstances);
  await updateValuesInAdapterContract(adapterContract, currentPrices);
  return adapterContract;
};
