import { Transaction } from "@mysten/sui/transactions";
import { SUI_FRAMEWORK_ADDRESS } from "@mysten/sui/utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import assert from "node:assert";
import {
  DEFAULT_GAS_BUDGET,
  makeSuiClient,
  SuiNetworkName,
  SuiNetworkSchema,
} from "../../src";

async function fetchCoinObjects(
  network: SuiNetworkName,
  senderAddress: string
) {
  const coins = await makeSuiClient(network).getCoins({ owner: senderAddress });
  assert(!coins.hasNextPage, "Too many coins");

  return coins.data
    .filter((data) => data.coinType === `${SUI_FRAMEWORK_ADDRESS}::sui::SUI`)
    .map((data) => ({
      objectId: data.coinObjectId,
      version: data.version,
      digest: data.digest,
    }));
}

export async function makeBaseTx(
  creator: (tx: Transaction, network: SuiNetworkName) => void,
  senderAddress: string
) {
  const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);

  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  tx.setGasPayment(await fetchCoinObjects(network, senderAddress));

  creator(tx, network);

  return { network, tx };
}
