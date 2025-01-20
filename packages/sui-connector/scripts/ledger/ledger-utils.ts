import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { fromBase64 } from "@mysten/bcs";
import Sui from "@mysten/ledgerjs-hw-app-sui";
import {
  messageWithIntent,
  toSerializedSignature,
} from "@mysten/sui/cryptography";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { hexlify } from "ethers/lib/utils";

const getDerivationPath = (accountId: number) => `44'/784'/${accountId}'/0'/0'`;

const getPublicKey = async (sui: Sui, accountId = 0) => {
  const result = await sui.getPublicKey(getDerivationPath(accountId));

  return {
    publicKey: hexlify(result.publicKey),
    address: hexlify(result.address),
    ed: new Ed25519PublicKey(result.publicKey),
  };
};

async function makeSui() {
  const transport = await TransportNodeHid.create();
  const sui = new Sui(transport);
  console.log(await sui.getVersion());

  return sui;
}

const main = async (accountId = 0) => {
  const sui = await makeSui();
  const publicKey = await getPublicKey(sui, accountId);
  console.log(publicKey);

  const args = process.argv.slice(2);
  const transactionArg = args[0];

  if (!transactionArg) {
    return;
  }
  console.log("Signing transaction with input:", transactionArg);
  const tx = messageWithIntent(
    "TransactionData",
    fromBase64(transactionArg)
  ) as string;
  console.log(tx);
  const signed = await sui.signTransaction(getDerivationPath(accountId), tx);
  console.log("Signed Transaction:");

  console.log(
    toSerializedSignature({
      signature: signed.signature,
      signatureScheme: "ED25519",
      publicKey: publicKey.ed,
    })
  );
};

// Connect the ledger
// Run the Sui application on it or rerun it when the ledger has gone into sleep mode
// WARN ON THE account ID (Default set to 0, as the first account)
main().catch((err) => console.log(err));
