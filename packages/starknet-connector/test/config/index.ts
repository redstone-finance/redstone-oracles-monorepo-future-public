import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { z } from "zod";
import { StarknetConfig } from "../../src";

export const PRICE_ADAPTER_ADDRESS =
  "0x02ce7a1936c3bf96c3bbcbdebc36d97f22b11662231502cb2d355ef417aa2ab4";
export const PRICE_FEED_ADDRESS =
  "0x037d35a079a441e0a40a8f2d29d6626acd09092e8e6825e746631e214a6a9f43";

export const config = Object.freeze(<StarknetConfig>{
  rpcUrl: RedstoneCommon.getFromEnv("RPC_URL", z.string().url()),
  ownerAddress: RedstoneCommon.getFromEnv("OWNER_ADDRESS"),
  privateKey: RedstoneCommon.getFromEnv("PRIVATE_KEY"),
});
