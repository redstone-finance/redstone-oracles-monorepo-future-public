import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";

const SCRYPTO_DIR = `../scrypto`;

export const NETWORK = {
  id: NetworkId.Stokenet,
  name: "stokenet",
};

export const DATA_SERVICE_ID = "redstone-primary-prod";
export const PRICE_ADAPTER_NAME = "price_adapter";
export const PRICE_FEED_NAME = "price_feed";
export const PROXY_NAME = "proxy";
export const BADGE_CREATOR_NAME = "badge_creator";

export const IS_CI = RedstoneCommon.getFromEnv(
  "IS_CI",
  z.boolean().default(false)
);
export const PRIVATE_KEY = {
  ed25519: IS_CI ? "" : RedstoneCommon.getFromEnv("PRIVATE_KEY"),
};

export async function loadAddress(
  entityType: "component" | "package",
  contractName: string,
  clientName?: string
) {
  return (
    await fs.promises.readFile(
      getContractFilename(
        formatAddressFilename(clientName, entityType),
        contractName,
        "deployed"
      ),
      "utf8"
    )
  ).trim();
}

export async function saveAddress(
  entityType: "component" | "package",
  contractName: string,
  address: string,
  clientName?: string
) {
  await fs.promises.writeFile(
    getContractFilename(
      formatAddressFilename(clientName, entityType),
      contractName
    ),
    address
  );
}

export function getContractFilename(
  filename: string,
  ...subdirectories: string[]
) {
  return path.join(
    __dirname,
    SCRYPTO_DIR,
    "contracts",
    ...subdirectories,
    filename
  );
}

function formatAddressFilename(
  clientName: string | undefined,
  entityType: "component" | "package"
) {
  return `${clientName ? `${clientName}.` : ""}${NETWORK.id}.${entityType}.addr`;
}
