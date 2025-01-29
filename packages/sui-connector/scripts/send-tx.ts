import { Transaction } from "@mysten/sui/transactions";
import "dotenv/config";
import { makeSuiClient, makeSuiKeypair, SuiNetworkName } from "../src";
import { makeBaseTx } from "./ledger/make-base-tx";
import { setUpUpgradeTx } from "./ledger/upgrade-package";

async function main(
  creator: (tx: Transaction, network: SuiNetworkName) => void
) {
  const keypair = makeSuiKeypair();
  const { tx, network } = await makeBaseTx(creator, keypair.toSuiAddress());
  const client = makeSuiClient(network);

  const txBytes = await tx.build({ client });
  const signature = (await keypair.signTransaction(txBytes)).signature;

  const simulationResult = await client.dryRunTransactionBlock({
    transactionBlock: txBytes,
  });
  if (simulationResult.effects.status.status === "success") {
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature,
      options: {
        showEffects: true,
      },
    });
    console.log("Result: ", result);
  } else {
    console.log("Simulation failed: ", simulationResult);
  }
}

void main(setUpUpgradeTx);
