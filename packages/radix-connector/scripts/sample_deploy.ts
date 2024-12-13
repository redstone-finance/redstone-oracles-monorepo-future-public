import { RedstoneCommon } from "@redstone-finance/utils";
import { readFileSync } from "node:fs";
import { RadixPackageDeployer } from "./RadixPackageDeployer";
import {
  getContractFilename,
  NETWORK,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

async function deploy(contractName: string) {
  const client = new RadixPackageDeployer(PRIVATE_KEY, NETWORK.id);

  const wasm = readFileSync(
    getContractFilename(`${contractName}.wasm`, `${contractName}/artifacts`)
  );
  const rpd = readFileSync(
    getContractFilename(`${contractName}.rpd`, `${contractName}/artifacts`)
  );
  const feeLock = 120;

  const packageId = await client.deployPackage(wasm, rpd, feeLock);

  await saveAddress("component", contractName, packageId);
}

void deploy(RedstoneCommon.getFromEnv("CONTRACT_NAME"));
