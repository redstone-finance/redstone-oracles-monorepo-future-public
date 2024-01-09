import { RedstoneOraclesInput } from "@redstone-finance/oracles-smartweave-contracts";
import prompts from "prompts";
import { getOracleRegistryContract } from "./utils/arweave-utils";
import niceLogger from "./utils/nice-logger";

export const updateDataServiceManifest = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "id",
      message: "Provide id of data feed",
      validate: (value) => (!value ? "Id is required" : true),
    },
    {
      type: "text",
      name: "manifestTransactionId",
      message: "Provide the manifest transaction id",
      validate: (value) =>
        !value ? "Manifest transaction id is required" : true,
    },
    {
      type: "text",
      name: "walletFilePath",
      message: "Provide absolute path to wallet file",
      validate: (value) => (!value ? "Wallet file is required" : true),
    },
  ]);

  const contract = getOracleRegistryContract(response.walletFilePath);

  const dataFeedData = {
    id: response.id,
    update: {
      manifestTxId: response.manifestTransactionId,
    },
  };
  const updateDataServiceTransaction =
    await contract.bundleInteraction<RedstoneOraclesInput>({
      function: "updateDataService",
      data: dataFeedData,
    });
  console.log(`Update data feed manifest transaction sent`);
  niceLogger.log(updateDataServiceTransaction);
};
