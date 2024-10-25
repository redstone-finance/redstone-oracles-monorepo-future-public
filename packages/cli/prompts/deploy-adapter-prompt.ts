import { spawn } from "child_process";
import { isAddress } from "ethers/lib/utils";
import prompts, { PromptObject } from "prompts";
import { isUrl } from "../src/validations";

export const deployMultiFeedAdapter = async () => {
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
      name: "proxyAdminOwner",
      message: "Proxy Admin Owner",
      validate: (value) =>
        isAddress(value as string) ? true : "Invalid address",
    },
    {
      // hardhat will validate private key
      type: "password",
      name: "privateKey",
      message: "Private key",
    },
  ] as PromptObject[];

  const { networkName, networkRpcUrl, proxyAdminOwner, privateKey } =
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
