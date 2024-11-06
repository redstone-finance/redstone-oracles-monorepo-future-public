import { spawn } from "child_process";
import { isAddress } from "ethers/lib/utils";
import prompts, { PromptObject } from "prompts";
import { onCancel } from "../src/utils";
import { isUrl } from "../src/validations";

interface PromptResponse {
  networkName: string;
  networkRpcUrl: string;
  proxyAdminOwner: string;
  privateKey: string;
}

export const deployMultiFeedAdapterPrompt = async () => {
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
      name: "proxyAdminOwner",
      message: "Proxy Admin Owner",
      validate: (value: string) => isAddress(value) || "Invalid address",
    },
    {
      // hardhat will validate private key
      type: "password",
      name: "privateKey",
      message: "Private key",
    },
  ];

  const { networkName, networkRpcUrl, proxyAdminOwner, privateKey } =
    (await prompts(questions, { onCancel })) as PromptResponse;

  process.env.NETWORK_NAME = networkName;
  process.env.NETWORK_RPC_URL = networkRpcUrl;
  process.env.PRIVATE_KEY = privateKey;

  const hardhatProcess = spawn(
    "npx",
    [
      "hardhat",
      "deploy-multi-feed-adapter",
      "--network",
      networkName,
      "--proxy-admin-owner",
      proxyAdminOwner,
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
