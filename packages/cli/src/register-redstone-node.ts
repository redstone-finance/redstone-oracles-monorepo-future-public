import prompts from "prompts";
import { getOracleRegistryContract } from "./utils/arweave-utils";
import { RedstoneOraclesInput } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import niceLogger from "./utils/nice-logger";

export const registerRedstoneNode = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "name",
      message: "Provide name of redstone node",
      validate: (value) => (!value ? "Name is required" : true),
    },
    {
      type: "text",
      name: "logo",
      message: "Provide logo URL of redstone node",
      validate: (value) => (!value ? "Logo URL is required" : true),
    },
    {
      type: "text",
      name: "description",
      message: "Provide description of redstone node",
      validate: (value) => (!value ? "Description is required" : true),
    },
    {
      type: "text",
      name: "dataServiceId",
      message: "Provide data feed id of redstone node",
      validate: (value) => (!value ? "Data feed id is required" : true),
    },
    {
      type: "text",
      name: "evmAddress",
      message: "Provide EVM address of redstone node",
      validate: (value) => (!value ? "EVM address is required" : true),
    },
    {
      type: "text",
      name: "ipAddress",
      message: "Provide IP address of redstone node",
      validate: (value) => (!value ? "Ip address is required" : true),
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

  const { name, logo, description, dataServiceId, evmAddress, ipAddress, url } =
    response;
  const nodeDetails = {
    name,
    logo,
    description,
    dataServiceId,
    evmAddress,
    ipAddress,
    ...(!!url && { url }),
  };
  const registerNodeTransaction =
    await contract.bundleInteraction<RedstoneOraclesInput>({
      function: "registerNode",
      data: nodeDetails,
    });
  console.log(`Sent register redstone node transaction`);
  niceLogger.log(registerNodeTransaction);
};
