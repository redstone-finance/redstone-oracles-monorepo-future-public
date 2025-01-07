import { RedstoneCommon } from "@redstone-finance/utils";
import { readFileSync } from "node:fs";
import { RadixPackageDeployer } from "./RadixPackageDeployer";
import {
  getContractFilename,
  NETWORK,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

const DEFAULT_DEPLOY_FEE_LOCK = 200;

async function deploy(contractName: string) {
  const client = new RadixPackageDeployer(NETWORK.id, PRIVATE_KEY);

  const wasm = readFileSync(
    getContractFilename(
      `${contractName}_with_schema.wasm`,
      `${contractName}/artifacts`
    )
  );
  const rpd = readFileSync(
    getContractFilename(`${contractName}.rpd`, `${contractName}/artifacts`)
  );

  const packageId = await client.deployPackage(
    wasm,
    rpd,
    DEFAULT_DEPLOY_FEE_LOCK
  );

  await saveAddress("package", contractName, packageId);
}

void deploy(RedstoneCommon.getFromEnv("CONTRACT_NAME"));
