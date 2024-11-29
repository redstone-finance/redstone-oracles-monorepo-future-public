import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";

const SCRYPTO_DIR = `../../scrypto`;

export const CONTRACT_NAME = "price_adapter";
export const IS_CI = RedstoneCommon.getFromEnv(
  "IS_CI",
  z.boolean().default(false)
);
export const PRIVATE_KEY = {
  ed25519: IS_CI ? "" : RedstoneCommon.getFromEnv("PRIVATE_KEY"),
};

export async function loadAddress(name: string, subdirectory?: string) {
  return await fs.promises.readFile(getFilename(name, subdirectory), "utf8");
}

export function getFilename(name: string, subdirectory?: string) {
  return path.join(
    __dirname,
    SCRYPTO_DIR,
    CONTRACT_NAME,
    subdirectory ? subdirectory : name,
    subdirectory ? name : ""
  );
}
