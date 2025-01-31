import { spawnSync } from "child_process";
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

export const deployAdapterAndFeedsPrompt = async () => {
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

  const adapterContractResult = spawnSync(
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
  if (adapterContractResult.error || adapterContractResult.status !== 0) {
    console.error(
      `Deploying adapter contract failed ${adapterContractResult.error ? `error: ${adapterContractResult.error.message}` : ""}`
    );
  }

  // for the beginning we want to deploy only 4 main tokens
  const defaultFeeds = "BTC,ETH,USDT,USDC";

  const priceFeedsResult = spawnSync(
    "npx",
    [
      "hardhat",
      "deploy-price-feeds",
      "--network",
      networkName,
      "--feeds",
      defaultFeeds,
    ],
    {
      stdio: "inherit",
    }
  );
  if (priceFeedsResult.error || priceFeedsResult.status !== 0) {
    console.error(
      `Deploying price feeds contracts failed ${priceFeedsResult.error ? `error: ${priceFeedsResult.error.message}` : ""}`
    );
  }
};
