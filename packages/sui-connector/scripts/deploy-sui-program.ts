import { bcs } from "@mysten/bcs";
import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { RedstoneCommon } from "@redstone-finance/utils";
import { spawn } from "child_process";
import "dotenv/config";
import { z } from "zod";
import {
  makeSuiClient,
  makeSuiKeypair,
  saveIds,
  serializeSigners,
  SuiNetworkName,
  SuiNetworkSchema,
} from "../src";
import { makeSuiDeployConfig } from "./DeployConfig";

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
    process.chdir("sui/contracts/price_adapter");
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
  adminCap: string,
  network: SuiNetworkName
): Promise<TransactionResult> {
  const tx = new Transaction();
  const config = makeSuiDeployConfig(network);
  const keypair = makeSuiKeypair();

  tx.setGasBudget(config.initializeTxGasBudget);

  tx.moveCall({
    target: `${packageId}::main::initialize_price_adapter`,
    arguments: [
      tx.object(adminCap),
      tx.pure(serializeSigners(config.signers)),
      tx.pure(bcs.u8().serialize(config.signerCountThreshold)),
      tx.pure(bcs.u64().serialize(config.maxTimestampDelayMs)),
      tx.pure(bcs.u64().serialize(config.maxTimestampAheadMs)),
      tx.pure(serializeSigners(config.trustedUpdaters)),
      tx.pure(bcs.u64().serialize(config.minIntervalBetweenUpdatesMs)),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });

  return result;
}

function getAdminCap(packageId: string, changes: ObjectChanges) {
  const created = changes.objectChanges?.filter((obj) => obj.type == "created");

  return created?.find(
    (obj) => obj.objectType == `${packageId}::admin::AdminCap`
  )?.objectId;
}

function getPriceAdapter(
  packageId: string,
  response: SuiTransactionBlockResponse
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
  const adminCap = getAdminCap(packageId, publishResult);
  if (!adminCap) {
    throw new Error("Admin cap not found");
  }

  const res = await initialize(client, packageId, adminCap, network);
  await client.waitForTransaction({ digest: res.digest });
  console.log("PriceAdapter initialized:", res);

  const details = await client.getTransactionBlock({
    digest: res.digest,
    options: { showObjectChanges: true },
  });
  const priceAdapterObjectId = getPriceAdapter(packageId, details);

  if (!priceAdapterObjectId) {
    throw new Error("Admin cap not found");
  }

  const ids = {
    packageId,
    priceAdapterObjectId,
    adminCapId: adminCap,
  };
  saveIds(ids, network);

  console.log(`PACKAGE_ID=${packageId}`);
  console.log(`ADAPTER_OBJECT_ID=${priceAdapterObjectId}`);
  console.log(`ADMINCAP_OBJECT_ID=${adminCap}`);
}

void main();
