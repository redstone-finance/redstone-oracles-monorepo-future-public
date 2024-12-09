// this import cannot be from index.ts as it will break gelato-relayer
// by introducing node dependencies like fs which gelato doesn't have
import { runRelayer } from "@redstone-finance/on-chain-relayer/src/run-relayer";
import prompts, { PromptObject } from "prompts";
import { onCancel } from "../src/utils";
import { areRpcUrlsValid } from "../src/validations";

interface PromptResponse {
  networkName: string;
  networkRpcUrls: string;
  interval: number;
  expectedTxDeliveryTimeInMS: number;
  twoDimensionalFees: number;
  privateKey: string;
  gasLimit?: number;
}

export const runRelayerPrompt = async () => {
  const questions: PromptObject[] = [
    {
      type: "text",
      name: "networkName",
      message: "Network name",
      validate: (value: string) => value.length > 0,
    },
    {
      type: "text",
      name: "networkRpcUrls",
      message:
        "Network RPC URLs comma-separated, e.g. https://rpc-url-1.com,https://rpc-url-2.com",
      validate: (value: string) => areRpcUrlsValid(value) || "Invalid URLs",
    },
    {
      type: "number",
      name: "interval",
      message: "Relayer iteration interval",
      initial: 5000,
      validate: (value: number) => value >= 0,
    },
    {
      type: "number",
      name: "expectedTxDeliveryTimeInMS",
      message: "Expected transaction delivery time in milliseconds",
      initial: 5000,
      validate: (value: number) => value >= 0,
    },
    {
      type: "confirm",
      name: "twoDimensionalFees",
      message:
        "Are fees two dimensional (yes for Arbitrum or ZKSync based networks)",
      initial: false,
    },
    {
      type: (prev: boolean) => (prev ? null : "number"),
      name: "gasLimit",
      message: "Gas limit for update transaction",
      initial: 750000,
      validate: (value: number) => value >= 0,
    },
    {
      type: "password",
      name: "privateKey",
      message: "Private key",
    },
  ];

  const {
    networkName,
    networkRpcUrls,
    interval,
    expectedTxDeliveryTimeInMS,
    twoDimensionalFees,
    privateKey,
    gasLimit,
  } = (await prompts(questions, { onCancel })) as PromptResponse;

  process.env.MANIFEST_FILE = `manifests/${networkName}MultiFeed.json`;
  process.env.RPC_URLS = JSON.stringify(networkRpcUrls.split(","));
  process.env.RELAYER_ITERATION_INTERVAL = interval.toString();
  process.env.EXPECTED_TX_DELIVERY_TIME_IN_MS =
    expectedTxDeliveryTimeInMS.toString();
  process.env.TWO_DIMENSIONAL_FEES = twoDimensionalFees.toString();
  process.env.PRIVATE_KEY = privateKey;
  process.env.FALLBACK_OFFSET_IN_MILLISECONDS = "0";

  if (gasLimit) {
    process.env.GAS_LIMIT = gasLimit.toString();
  }

  runRelayer();
};
