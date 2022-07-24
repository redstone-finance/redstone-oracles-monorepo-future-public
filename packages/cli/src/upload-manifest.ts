import prompts from "prompts";
import fs from "fs";
import { SmartWeaveTags } from "redstone-smartweave";
import { getWallet, initArweave } from "./utils/arweave-utils";

export const uploadManifest = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "manifestSourcePath",
      message: "Provide absolute path to manifest source file",
      validate: (value) =>
        !value ? "Manifest source path file is required" : true,
    },
    {
      type: "text",
      name: "walletFilePath",
      message: "Provide absolute path to wallet file",
      validate: (value) => (!value ? "Wallet file is required" : true),
    },
  ]);

  const newManifestSource = fs.readFileSync(
    response.manifestSourcePath,
    "utf8"
  );

  const wallet = getWallet(response.walletFilePath);
  const arweave = initArweave();

  const uploadManifestTransaction = await arweave.createTransaction(
    { data: newManifestSource },
    wallet
  );
  uploadManifestTransaction.addTag(
    SmartWeaveTags.APP_NAME,
    "SmartweaveManifestSource"
  );
  uploadManifestTransaction.addTag(SmartWeaveTags.APP_VERSION, "0.3.0");
  uploadManifestTransaction.addTag("Content-Type", "application/javascript");
  await arweave.transactions.sign(uploadManifestTransaction, wallet);
  await arweave.transactions.post(uploadManifestTransaction);
  console.log(
    `Upload manifest transaction id: ${uploadManifestTransaction.id}`
  );
};
