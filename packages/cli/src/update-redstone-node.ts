import prompts from "prompts";
import { getOracleRegistryContract } from "./utils/arweave-utils";
import { RedstoneOraclesInput } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import niceLogger from "./utils/nice-logger";

export const updateRedstoneNode = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "name",
      message: "Provide name of redstone node",
    },
    {
      type: "text",
      name: "logo",
      message: "Provide logo URL of redstone node",
    },
    {
      type: "text",
      name: "description",
      message: "Provide description of redstone node",
    },
    {
      type: "text",
      name: "dataServiceId",
      message: "Provide data feed id of redstone node",
    },
    {
      type: "text",
      name: "evmAddress",
      message: "Provide EVM address of redstone node",
    },
    {
      type: "text",
      name: "ipAddress",
      message: "Provide IP address of redstone node",
    },
    {
      type: "text",
      name: "ecdsaPublicKey",
      message: "Provide ECDSA public key of redstone node",
    },
    {
      type: "text",
      name: "arweavePublicKey",
      message: "Provide Arweave public key of redstone node",
    },
    {
      type: "text",
      name: "url",
      message: "Provide URL of redstone node",
    },
    {
      type: "text",
      name: "walletFilePath",
      message: "Provide absolute path to wallet file",
      validate: (value) => (!value ? "Wallet file is required" : true),
    },
  ]);

  const contract = getOracleRegistryContract(response.walletFilePath);

  const {
    name,
    logo,
    description,
    dataServiceId,
    evmAddress,
    ipAddress,
    ecdsaPublicKey,
    arweavePublicKey,
    url,
  } = response;
  const nodeDetails = {
    ...(!!name && { name }),
    ...(!!logo && { logo }),
    ...(!!description && { description }),
    ...(!!dataServiceId && { dataServiceId }),
    ...(!!evmAddress && { evmAddress }),
    ...(!!ipAddress && { ipAddress }),
    ...(!!ecdsaPublicKey && { ecdsaPublicKey }),
    ...(!!arweavePublicKey && { arweavePublicKey }),
    ...(!!url && { url }),
  };
  const updateNodeTransaction =
    await contract.bundleInteraction<RedstoneOraclesInput>({
      function: "updateNodeDetails",
      data: nodeDetails,
    });
  console.log(`Update redstone node transaction sent`);
  niceLogger.log(updateNodeTransaction);
};
