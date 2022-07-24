import prompts from "prompts";
import { getOracleRegistryContract } from "./utils/arweave-utils";
import { RedstoneOraclesInput } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import niceLogger from "./utils/nice-logger";

export const registerDataFeed = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "id",
      message: "Provide id of data feed",
      validate: (value) => (!value ? "Id is required" : true),
    },
    {
      type: "text",
      name: "name",
      message: "Provide name of data feed",
      validate: (value) => (!value ? "Name is required" : true),
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
      name: "logo",
      message: "Provide logo URL",
      validate: (value) => (!value ? "Logo URL is required" : true),
    },
    {
      type: "text",
      name: "description",
      message: "Provide description of data feed",
      validate: (value) => (!value ? "Description is required" : true),
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
    name: response.name,
    manifestTxId: response.manifestTransactionId,
    logo: response.logo,
    description: response.description,
  };
  const createDataFeedTransaction =
    await contract.bundleInteraction<RedstoneOraclesInput>({
      function: "createDataFeed",
      data: dataFeedData,
    });
  console.log(`Create data feed transaction sent`);
  niceLogger.log(createDataFeedTransaction);
};
