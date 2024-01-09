import fs from "fs";
import prompts from "prompts";
import { WarpFactory } from "warp-contracts";
import { getWallet } from "./utils/arweave-utils";

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
  const warp = WarpFactory.forMainnet();

  const uploadManifestTransaction = await warp.arweave.createTransaction(
    { data: newManifestSource },
    wallet
  );
  await warp.arweave.transactions.sign(uploadManifestTransaction, wallet);
  await warp.arweave.transactions.post(uploadManifestTransaction);
  console.log(
    `Upload manifest transaction id: ${uploadManifestTransaction.id}`
  );
};
