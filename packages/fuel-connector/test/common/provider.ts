import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { Provider } from "fuels";

const IS_LOCAL = true as boolean;
const IS_MAINNET = false as boolean;

export const LOCAL_NODE_URL = "http://127.0.0.1:4000/v1/graphql";
export const TESTNET_NODE_URL = "https://testnet.fuel.network/v1/graphql";

export const provider = async (isLocal = IS_LOCAL) =>
  isLocal
    ? undefined
    : await Provider.create(
        IS_MAINNET
          ? RedstoneCommon.getFromEnv("MAINNET_NODE_URL")
          : TESTNET_NODE_URL
      );
