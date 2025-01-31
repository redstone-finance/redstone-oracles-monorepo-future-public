import { spawn } from "child_process";
import prompts, { PromptObject } from "prompts";
import { onCancel } from "../src/utils";
import { areFeedsCommaSeparated, isUrl } from "../src/validations";

interface PromptResponse {
  networkName: string;
  networkRpcUrl: string;
  feeds: string;
  privateKey: string;
}

export const deployPriceFeedsPrompt = async () => {
  const questions: PromptObject[] = [
    {
      type: "text",
      name: "networkName",
      message: "Network name",
      validate: (value: string) => value.length > 0,
    },
    {
      type: "text",
      name: "networkRpcUrl",
      message: "Network RPC URL",
      validate: (value: string) => isUrl(value) || "Invalid URL",
    },
    {
      type: "text",
      name: "feeds",
      message: "Feeds to deploy comma-separated, e.g. ETH,BTC",
      validate: (value: string) =>
        areFeedsCommaSeparated(value) || "Invalid feeds",
    },
    {
      // hardhat will validate private key
      type: "password",
      name: "privateKey",
      message: "Private key",
    },
  ];

  const { networkName, networkRpcUrl, feeds, privateKey } = (await prompts(
    questions,
    { onCancel }
  )) as PromptResponse;

  process.env.NETWORK_NAME = networkName;
  process.env.NETWORK_RPC_URL = networkRpcUrl;
  process.env.PRIVATE_KEY = privateKey;

  const hardhatProcess = spawn(
    "npx",
    [
      "hardhat",
      "deploy-price-feeds",
      "--network",
      networkName,
      "--feeds",
      feeds,
    ],
    {
      stdio: "inherit",
    }
  );

  hardhatProcess.on("error", (error) => {
    console.error(`Error starting Hardhat script: ${error.message}`);
  });

  hardhatProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(
        `Deploying price feeds contracts failed with code ${code}.`
      );
    }
  });
};
