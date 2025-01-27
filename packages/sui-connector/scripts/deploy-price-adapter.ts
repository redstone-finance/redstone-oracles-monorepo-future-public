import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { RedstoneCommon } from "@redstone-finance/utils";
import { spawn } from "child_process";
import "dotenv/config";
import { z } from "zod";
import {
  getDeployDir,
  makeSuiClient,
  makeSuiDeployConfig,
  makeSuiKeypair,
  saveIds,
  SuiNetworkSchema,
  SuiPricesContractAdapter,
} from "../src";

interface ObjectChanges {
  objectChanges?: Array<{
    type: string;
    objectType: string;
    packageId?: string;
    objectId?: string;
  }>;
}

interface TransactionResult {
  digest: string;
}

async function executeCommand(
  command: string,
  args: string[]
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function executeSuiPublish(network: string): Promise<ObjectChanges> {
  const cwd = process.cwd();
  try {
    const skipFaucet = RedstoneCommon.getFromEnv(
      "SKIP_FAUCET",
      z.optional(z.boolean())
    );
    if ((network === "localnet" || network === "testnet") && !skipFaucet) {
      await executeCommand("sui", ["client", "faucet"]);
      console.log("waiting for faucet drip");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const cmd = ["client", "publish", "--json"];
    if (network === "testnet") {
      cmd.push("--skip-dependency-verification");
    }
    const deployDir = getDeployDir();

    console.log("===========================================================");
    console.log(`Deploying to ${network} from ${deployDir}`);
    console.log("===========================================================");
    process.chdir(deployDir);

    const output = await executeCommand("sui", cmd);

    console.log("Output:", output);

    return JSON.parse(output.split("Transaction digest:")[0]) as ObjectChanges;
  } catch (error) {
    console.error("Error executing sui client publish:", error);
    throw error;
  } finally {
    process.chdir(cwd);
  }
}

async function initialize(
  client: SuiClient,
  packageId: string,
  adminCap: string
): Promise<TransactionResult> {
  const tx = new Transaction();
  const config = makeSuiDeployConfig();
  const keypair = makeSuiKeypair();
  SuiPricesContractAdapter.initialize(tx, config, packageId, adminCap);

  return await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });
}

function findObject(changes: ObjectChanges, objectType: string) {
  const created = changes.objectChanges?.filter((obj) => obj.type == "created");

  return created?.find((obj) => obj.objectType == objectType)?.objectId;
}

function getAdminCap(changes: ObjectChanges, packageId: string) {
  return findObject(changes, `${packageId}::admin::AdminCap`);
}

function getUpgradeCap(changes: ObjectChanges) {
  return findObject(changes, `0x2::package::UpgradeCap`);
}

function getPriceAdapter(
  response: SuiTransactionBlockResponse,
  packageId: string
) {
  const created = response.objectChanges?.filter(
    (obj) => obj.type == "created"
  );

  return created?.find(
    (obj) => obj.objectType == `${packageId}::price_adapter::PriceAdapter`
  )?.objectId;
}

async function main() {
  const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);
  const client = makeSuiClient(network);

  const output = await executeCommand("sui", ["client", "active-env"]);
  if (!output.includes(network)) {
    throw new Error(`Not on ${network}, network is set to ${output}`);
  }

  const publicKey = await executeCommand("sui", ["client", "active-address"]);
  const keypairPublicKey = makeSuiKeypair().toSuiAddress();
  if (!publicKey.includes(keypairPublicKey)) {
    throw new Error(
      `Keypair address ${keypairPublicKey} != from ${publicKey} sui cli`
    );
  }

  const publishResult = await executeSuiPublish(network);
  const packageId = publishResult.objectChanges?.find(
    (v) => v.type === "published"
  )?.packageId;
  if (!packageId) {
    throw new Error("Package ID not found");
  }
  console.log("Publish result:", publishResult);
  const adminCap = getAdminCap(publishResult, packageId);
  if (!adminCap) {
    throw new Error("Admin cap not found");
  }

  const upgradeCap = getUpgradeCap(publishResult);
  if (!upgradeCap) {
    throw new Error("Upgrade cap not found");
  }

  const res = await initialize(client, packageId, adminCap);
  await client.waitForTransaction({ digest: res.digest });
  console.log("PriceAdapter initialized:", res);

  const details = await client.getTransactionBlock({
    digest: res.digest,
    options: { showObjectChanges: true },
  });
  const priceAdapterObjectId = getPriceAdapter(details, packageId);

  if (!priceAdapterObjectId) {
    throw new Error("priceAdapterObjectId not found");
  }

  const ids = {
    packageId,
    priceAdapterObjectId,
    adminCapId: adminCap,
    upgradeCapId: upgradeCap,
  };
  saveIds(ids, network);

  console.log(`PACKAGE_ID=${packageId}`);
  console.log(`ADAPTER_OBJECT_ID=${priceAdapterObjectId}`);
  console.log(`ADMINCAP_OBJECT_ID=${adminCap}`);
  console.log(`UPGRADECAP_OBJECT_ID=${upgradeCap}`);
}

void main();
