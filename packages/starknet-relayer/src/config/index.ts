import { NetworkName } from "@redstone-finance/starknet-connector";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { z } from "zod";

export type VERSION = "0";

export interface StarknetRelayerConfig {
  relayerIterationInterval: number;
  updatePriceInterval: number;
  network: NetworkName;
  privateKey: string;
  priceManagerAddress: string;
  priceManagerVersion: VERSION;
  ownerAddress: string;
  maxEthFee: number;
}

export const config = Object.freeze(<StarknetRelayerConfig>{
  relayerIterationInterval: RedstoneCommon.getFromEnv(
    "RELAYER_ITERATION_INTERVAL",
    z.number()
  ),
  updatePriceInterval: RedstoneCommon.getFromEnv(
    "UPDATE_PRICE_INTERVAL",
    z.number()
  ),
  network: RedstoneCommon.getFromEnv("NETWORK"),
  privateKey: RedstoneCommon.getFromEnv("PRIVATE_KEY"),
  priceManagerAddress: RedstoneCommon.getFromEnv("PRICE_MANAGER_ADDRESS"),
  priceManagerVersion: RedstoneCommon.getFromEnv(
    "PRICE_MANAGER_VERSION"
  ) as VERSION,
  ownerAddress: RedstoneCommon.getFromEnv("OWNER_ADDRESS"),
  maxEthFee: RedstoneCommon.getFromEnv("MAX_ETH_FEE", z.number()),
});
