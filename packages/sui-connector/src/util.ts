import { bcs, BcsType } from "@mysten/bcs";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import type { Keypair } from "@mysten/sui/cryptography";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { RedstoneCommon } from "@redstone-finance/utils";
import { arrayify, isHexString } from "ethers/lib/utils";
import fs from "fs";
import path from "path";
import { SuiConfig, SuiNetworkName } from "./config";

interface Ids {
  packageId: string;
  priceAdapterObjectId: string;
  adminCapId: string;
}

function getIdsFilePath(network: string) {
  return path.join(__dirname, `../object_ids.${network}.json`);
}

export function readIds(network: SuiNetworkName): Ids {
  return JSON.parse(fs.readFileSync(getIdsFilePath(network), "utf8")) as Ids;
}

export function saveIds(ids: Ids, network: SuiNetworkName): void {
  fs.writeFileSync(getIdsFilePath(network), JSON.stringify(ids, null, "\n"));
}

export function readSuiConfig(network: SuiNetworkName): SuiConfig {
  const ids = readIds(network);

  return {
    ...ids,
    network,
  };
}

export function makeSuiKeypair(privateKey?: string): Keypair {
  const key = privateKey ?? RedstoneCommon.getFromEnv("PRIVATE_KEY");
  if (!key) {
    throw new Error("PRIVATE_KEY is not set, privateKey param not provided");
  }

  return Secp256k1Keypair.fromSecretKey(
    isHexString(key, 32) ? arrayify(key) : key
  );
}

export function makeSuiClient(
  network: SuiNetworkName,
  url?: string
): SuiClient {
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
      .slice(2)
      .match(/.{2}/g)!
      .map((byte) => parseInt(byte, 16))
  );
}

export function serialize<T, U>(
  type: BcsType<T, U>,
  value: U,
  asOptional = false
) {
  return (asOptional ? bcs.option(type) : type).serialize(value);
}

export function serializeSigners(signers: string[], asOptional = false) {
  return serialize(
    bcs.vector(bcs.vector(bcs.u8())),
    signers.map(hexToBytes),
    asOptional
  );
}

export function makeFeedIdBytes(feedId: string): Uint8Array {
  return Uint8Array.from(Buffer.from(feedId.padEnd(32, "\0")));
}

export function uint8ArrayToBcs(uint8Array: Uint8Array) {
  return bcs.vector(bcs.u8()).serialize(uint8Array);
}
