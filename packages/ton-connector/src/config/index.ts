import { RedstoneCommon } from "@redstone-finance/utils";
import { TonApiV2Config } from "../network/TonNetwork";

const API_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export type TonConnectorConfig = TonApiV2Config & {
  mnemonic: string[];
};

export const config = Object.freeze(<TonConnectorConfig>{
  mnemonic: RedstoneCommon.getFromEnv("WALLET_MNEMONIC").split(" "),
  apiKey: RedstoneCommon.getFromEnv("TONCENTER_API_KEY"),
  endpoint: API_ENDPOINT,
});
