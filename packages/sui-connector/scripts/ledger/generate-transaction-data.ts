import { toBase64 } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import { makeSuiClient, SuiNetworkName, SuiNetworkSchema } from "../../src";

const MULTI_SIG_ADDRESS =
  "0x2fb6aa8a4bdedb65c0979747e954cd92ede02ecd8d401b1df4be9f9d81c4b8b1";

export async function generateTransactionData(
  creator: (tx: Transaction, network: SuiNetworkName) => void,
  multiSigAddress = MULTI_SIG_ADDRESS
) {
  const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);

  const tx = new Transaction();
  tx.setSender(multiSigAddress);

  creator(tx, network);

  console.log(toBase64(await tx.build({ client: makeSuiClient(network) })));
}
