import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { z } from "zod";

export interface StarknetRelayerConfig {
  relayerIterationInterval: number;
  updatePriceInterval: number;
  rpcUrl: string;
  privateKey: string;
  priceAdapterAddress: string;
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
  rpcUrl: RedstoneCommon.getFromEnv("RPC_URL", z.string().url()),
  privateKey: RedstoneCommon.getFromEnv("PRIVATE_KEY"),
  priceAdapterAddress: RedstoneCommon.getFromEnv("PRICE_ADAPTER_ADDRESS"),
  ownerAddress: RedstoneCommon.getFromEnv("OWNER_ADDRESS"),
  maxEthFee: RedstoneCommon.getFromEnv("MAX_ETH_FEE", z.number()),
});
