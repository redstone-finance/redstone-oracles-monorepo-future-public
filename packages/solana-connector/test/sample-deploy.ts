import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import { RedstoneCommon } from "@redstone-finance/utils";
import {
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import {
  connectionTo,
  PriceAdapterContract,
} from "../src/PriceContractAdapter";
import { hexToU8Array } from "../src/utils";

function deploy() {
  const cluster = RedstoneCommon.getFromEnv("CLUSTER");

  const deployCmd = `cd solana && anchor deploy --provider.cluster ${cluster}`;

  execSync(deployCmd, { stdio: ["inherit", "inherit", "inherit"] });
}

async function initialize() {
  const url = RedstoneCommon.getFromEnv("URL");
  const secret = RedstoneCommon.getFromEnv("PRIVATE_KEY");

  const connection = connectionTo(url);
  const keypair = Keypair.fromSecretKey(hexToU8Array(secret));
  const contract = new PriceAdapterContract(connection);
  const signers = getSignersForDataServiceId("redstone-primary-prod");

  const tx = new Transaction();
  const instr = await contract.initialize(
    keypair.publicKey,
    signers!.map((signer) => Array.from(Buffer.from(signer.slice(2), "hex"))),
    [],
    1,
    15 * 60 * 1000,
    3 * 60 * 1000,
    1_000
  );
  tx.add(instr);

  const txId = await sendAndConfirmTransaction(connection, tx, [keypair]);
  const config = await contract.getConfig();

  console.log(`Config initialize at ${txId}`);
  console.log(config);
}

async function main() {
  dotenv.config();

  deploy();
  await setTimeout(15_000); // wait 15 secodns before
  await initialize();
}

void main();
