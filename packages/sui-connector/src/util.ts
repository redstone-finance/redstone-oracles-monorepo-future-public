import { bcs } from "@mysten/bcs";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import type { Keypair } from "@mysten/sui/cryptography";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { RedstoneCommon } from "@redstone-finance/utils";
import fs from "fs";
import path from "path";
import { Network, SuiConfig, SuiConfigSchema } from "./config";

interface Ids {
  packageId: string;
  priceAdapterObjectId: string;
  adminCapId: string;
}

function readIds(idFile: string | undefined): Ids | undefined {
  if (idFile === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(fs.readFileSync(idFile, "utf8"));
  } catch {
    return undefined;
  }
}

export function saveIds(ids: Ids, network: Network): void {
  const file_path = path.join(process.cwd(), `./object_ids.${network}.json`);
  fs.writeFile(file_path, JSON.stringify(ids), (e) => e);
}

export async function ensureSuiBalance(
  client: SuiClient,
  address: string,
  network: Network,
  amount: number = 10 ** 9 * 2
) {
  const balance = await client.getBalance({
    owner: address,
  });
  if (parseInt(balance.totalBalance) < amount && network !== "mainnet") {
    const res = await requestSuiFromFaucetV0({
      host: getFaucetHost(network),
      recipient: address,
    });
    if (res.error) {
      throw new Error(res.error);
    }
  }
}

export function readSuiConfig(network: Network): SuiConfig {
  const ids = readIds(RedstoneCommon.getFromEnv("ID_FILE"));
  return SuiConfigSchema.parse({
    network,
    packageId: ids?.packageId ?? "",
    priceAdapterObjectId: ids?.priceAdapterObjectId ?? "",
  });
}

export function makeSuiKeypair(privateKey?: string): Keypair {
  const key = privateKey ?? RedstoneCommon.getFromEnv("PRIVATE_KEY");
  if (!key) {
    throw new Error("PRIVATE_KEY is not set, privateKey param not provided");
  }
  return Secp256k1Keypair.fromSecretKey(key);
}

export function makeSuiClient(network: Network, url?: string): SuiClient {
  return new SuiClient({
    url: url ?? getFullnodeUrl(network),
  });
}

export function hexToBytes(data: string): Uint8Array {
  if (!data.startsWith("0x")) {
    throw new Error("Hex string must start with 0x");
  }

  return Uint8Array.from(
    data
      .slice(2)!
      .match(/.{2}/g)!
      .map((byte) => parseInt(byte, 16))
  );
}

export function serializeSigners(signers: string[]) {
  return bcs
    .vector(bcs.vector(bcs.u8()))
    .serialize(signers.map((s) => hexToBytes(s)));
}

export function makeFeedIdBytes(feedId: string): Uint8Array {
  return Uint8Array.from(Buffer.from(feedId.padEnd(32, "\0")));
}

export function uint8ArrayToBcs(uint8Array: Uint8Array) {
  return bcs.vector(bcs.u8()).serialize(uint8Array);
}
