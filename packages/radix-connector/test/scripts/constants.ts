import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";

const SCRYPTO_DIR = `../../scrypto`;

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

export async function loadAddress(name: string, subdirectory?: string) {
  return (
    await fs.promises.readFile(getFilename(name, subdirectory), "utf8")
  ).trim();
}

export function getFilename(name: string, subdirectory?: string) {
  return path.join(
    __dirname,
    SCRYPTO_DIR,
    subdirectory ? subdirectory : name,
    subdirectory ? name : ""
  );
}
