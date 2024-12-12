import { RedstoneCommon } from "@redstone-finance/utils";
import fs from "fs";
import { readFileSync } from "node:fs";
import { RadixPackageDeployer } from "./RadixPackageDeployer";
import { getFilename, NETWORK, PRIVATE_KEY } from "./constants";

async function deploy(contractName: string) {
  const client = new RadixPackageDeployer(PRIVATE_KEY, NETWORK.id);

  const wasm = readFileSync(
    getFilename(`${contractName}.wasm`, `${contractName}/artifacts`)
  );
  const rpd = readFileSync(
    getFilename(`${contractName}.rpd`, `${contractName}/artifacts`)
  );
  const feeLock = 120;

  const packageId = await client.deployPackage(wasm, rpd, feeLock);
  await fs.promises.writeFile(
    getFilename(`package.${NETWORK.name}.addr`, contractName),
    packageId
  );
}

void deploy(RedstoneCommon.getFromEnv("CONTRACT_NAME"));
