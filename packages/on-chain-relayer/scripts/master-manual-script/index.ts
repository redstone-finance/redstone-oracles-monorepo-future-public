import { getSSMParameterValue } from "@redstone-finance/internal-utils";
import { AdapterType } from "@redstone-finance/on-chain-relayer-common";
import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";
import { setConfigProvider } from "../../src/config";
import { clearCachedRelayerProvider } from "../../src/core/contract-interactions/get-relayer-provider";
import { clearCachedTxDeliveryMan } from "../../src/core/TxDeliveryManSingleton";
import { fileSystemConfigProvider } from "../../src/FilesystemConfigProvider";
import { runIteration } from "../../src/run-iteration";
import {
  readClassicManifests,
  readMultiFeedManifests,
} from "../read-manifests";
import { relayerNameToManualKeyArn } from "./relayer-name-to-manual-key";

const relayersToSkipFromEnv = RedstoneCommon.getFromEnv(
  "RELAYERS_TO_SKIP",
  z.string().array().default([])
);

const relayersToExecute = RedstoneCommon.getFromEnv(
  "RELAYERS_TO_EXECUTE",
  z.string().array().optional()
);

const privateKeyOverride = RedstoneCommon.getFromEnv(
  "PRIVATE_KEY_OVERRIDE",
  z.string().optional()
);

const defaultRelayersToSkip = [
  "cadenceCantoTestnet",
  "sepoliaAngleAgeur",
  "sepoliaVenusXvs",
  "venusBnbTestnet",
  "venusBnbTrx",
  "venusMainnetXvs",
  "optimismDevMultiFeed",
  "haven1Testnet",
  "sepoliaMultiFeed",
  "blastTestnet",
];

function getManualKeySSMName(manifestName: string) {
  if (relayerNameToManualKeyArn[manifestName]) {
    return relayerNameToManualKeyArn[manifestName];
  }
  const encodedManifestName = manifestName
    .replace(/fundamental/g, "-fundamental")
    .replace(/Testnet/g, "-testnet")
    .replace(/cadenceCanto/g, "canto/cadence")
    .replace(/abracadabraKava/g, "kava/abracadabra")
    // Insert a slash before the first uppercase letter
    .replace(/([A-Z])/, "/$1")
    // Replace uppercase letters not preceded by a slash with hyphen followed by lowercase
    .replace(/\/([A-Z])|([A-Z])/g, (_match, p1: string, p2: string) => {
      if (p1) {
        // If the uppercase letter is right after a slash, convert it to lowercase
        return `/${p1.toLowerCase()}`;
      }
      // Otherwise, replace the uppercase letter with hyphen + lowercase
      return `-${p2.toLowerCase()}`;
    });
  if (encodedManifestName.includes("cadence")) {
    return `/prod/on-chain-relayer/${encodedManifestName}/private-key`;
  }
  if (encodedManifestName.includes("abracadabra")) {
    return `/prod/on-chain-relayer/${encodedManifestName}`;
  }
  return `/prod/on-chain-relayer/${encodedManifestName}/manual/private-key`;
}

function clearCacheAndSetConfig() {
  clearCachedTxDeliveryMan();
  clearCachedRelayerProvider();
  setConfigProvider(fileSystemConfigProvider);
}

async function setUpEnvVariables(
  manifestName: string,
  chainId: number,
  adapterContractType: AdapterType
) {
  process.env.MANIFEST_FILE = `./relayer-manifests${adapterContractType === "multi-feed" ? "-multi-feed" : ""}/${manifestName}.json`;
  try {
    process.env.PRIVATE_KEY =
      privateKeyOverride ??
      (await getSSMParameterValue(getManualKeySSMName(manifestName)));
  } catch {
    console.log(
      `📛Failed to fetch wallet key: ${getManualKeySSMName(manifestName)}📛`
    );
    return false;
  }
  try {
    process.env.RPC_URLS = await getSSMParameterValue(
      `/prod/rpc/${chainId}/urls`
    );
  } catch {
    console.log(`📛Failed to fetch rpc urls: /prod/rpc/${chainId}/urls📛`);
    return false;
  }
  return true;
}

async function main() {
  const relayersToSkip = [...defaultRelayersToSkip, ...relayersToSkipFromEnv];
  const classicManifests = readClassicManifests();
  const multiFeedManifests = readMultiFeedManifests();
  const manifests = { ...classicManifests, ...multiFeedManifests };

  for (const [manifestName, { chain, adapterContractType }] of Object.entries(
    manifests
  )) {
    if (
      (relayersToExecute && !relayersToExecute.includes(manifestName)) ||
      relayersToSkip.includes(manifestName)
    ) {
      continue;
    }

    console.log(
      `\n****************************************\n`,
      `Running iteration of ${manifestName} relayer.`,
      `\n****************************************\n`
    );

    if (
      !(await setUpEnvVariables(manifestName, chain.id, adapterContractType))
    ) {
      continue;
    }

    clearCacheAndSetConfig();

    try {
      const iteration = runIteration();
      await RedstoneCommon.timeout(iteration, 15000);
    } catch (e) {
      console.error(
        `An error occured while running iteration of ${manifestName}`,
        e
      );
    }
  }
  console.log("All relayers iterations finished.");
}

void main();
