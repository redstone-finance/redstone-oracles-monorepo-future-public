import { toBase64 } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import "dotenv/config";
import { makeSuiClient, SuiNetworkName } from "../../src";
import { makeBaseTx } from "./make-base-tx";

export const MULTI_SIG_ADDRESS =
  "0x2fb6aa8a4bdedb65c0979747e954cd92ede02ecd8d401b1df4be9f9d81c4b8b1";

export async function generateTransactionData(
  creator: (tx: Transaction, network: SuiNetworkName) => void,
  multiSigAddress = MULTI_SIG_ADDRESS
) {
  const { network, tx } = await makeBaseTx(creator, multiSigAddress);

  const encodedTransaction = toBase64(
    await tx.build({ client: makeSuiClient(network) })
  );
  console.log(encodedTransaction);

  return encodedTransaction;
}
