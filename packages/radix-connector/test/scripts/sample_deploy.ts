import fs from "fs";
import { readFileSync } from "node:fs";
import { RadixPackageDeployer } from "./RadixPackageDeployer";
import { CONTRACT_NAME, getFilename, NETWORK, PRIVATE_KEY } from "./constants";

async function deploy() {
  const client = new RadixPackageDeployer(PRIVATE_KEY, NETWORK.id);

  const wasm = readFileSync(getFilename(`${CONTRACT_NAME}.wasm`, "artifacts"));
  const rpd = readFileSync(getFilename(`${CONTRACT_NAME}.rpd`, "artifacts"));
  const feeLock = 120;

  const packageId = await client.deployPackage(wasm, rpd, feeLock);
  await fs.promises.writeFile(
    getFilename(`package.${NETWORK.name}.addr`),
    packageId
  );
}

void deploy();
