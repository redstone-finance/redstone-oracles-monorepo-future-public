import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { Provider, Wallet } from "fuels";
import { z } from "zod";

export const IS_CI = RedstoneCommon.getFromEnv(
  "IS_CI",
  z.boolean().default(false)
);

const IS_LOCAL = true as boolean;
const IS_MAINNET = false as boolean;

const LOCAL_NODE_URL = "http://127.0.0.1:4000/v1/graphql";
const TESTNET_NODE_URL = "https://testnet.fuel.network/v1/graphql";

export const provider = async (isLocal = IS_LOCAL) =>
  isLocal
    ? undefined
    : await Provider.create(
        IS_MAINNET
          ? RedstoneCommon.getFromEnv("MAINNET_NODE_URL")
          : TESTNET_NODE_URL
      );

export async function getWallet(provider?: Provider) {
  const privateKey = RedstoneCommon.getFromEnv("PRIVATE_KEY");
  if (privateKey) {
    return Wallet.fromPrivateKey(
      privateKey,
      provider ?? (await Provider.create(LOCAL_NODE_URL))
    );
  }

  throw new Error("Non-empty PRIVATE_KEY must be defined in env!");
}
