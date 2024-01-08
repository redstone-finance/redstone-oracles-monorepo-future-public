import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";

const API_V2_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export const config = Object.freeze({
  relayerIterationInterval: RedstoneCommon.getFromEnv(
    "RELAYER_ITERATION_INTERVAL"
  ),
  healthcheckPingUrl: RedstoneCommon.getFromEnv("HEALTHCHECK_PING_URL"),
  endpoint: API_V2_ENDPOINT,
  apiKey: RedstoneCommon.getFromEnv("TONCENTER_API_KEY"),
  walletMnemonic: RedstoneCommon.getFromEnv("WALLET_MNEMONIC").split(" "),
  manifestFile: RedstoneCommon.getFromEnv("MANIFEST_FILE"),
});
