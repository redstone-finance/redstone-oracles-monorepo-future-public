import { spawn } from "child_process";
import prompts, { PromptObject } from "prompts";
import { areFeedsCommaSeparated, isUrl } from "../src/validations";

export const deployPriceFeeds = async () => {
  const questions = [
    {
      type: "text",
      name: "networkName",
      message: "Network name",
    },
    {
      type: "text",
      name: "networkRpcUrl",
      message: "Network RPC URL",
      validate: (value) => (isUrl(value as string) ? true : "Invalid URL"),
    },
    {
      type: "text",
      name: "feeds",
      message: "Feeds to deploy comma-separated, e.g. ETH,BTC",
      validate: (value) =>
        areFeedsCommaSeparated(value as string) ? true : "Invalid feeds",
    },
    {
      // hardhat will validate private key
      type: "password",
      name: "privateKey",
      message: "Private key",
    },
  ] as PromptObject[];

  const { networkName, networkRpcUrl, feeds, privateKey } =
    await prompts(questions);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  process.env.NETWORK_NAME = networkName;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  process.env.NETWORK_RPC_URL = networkRpcUrl;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      console.error(`Deploying adapter contract failed with code ${code}.`);
    }
  });
};
