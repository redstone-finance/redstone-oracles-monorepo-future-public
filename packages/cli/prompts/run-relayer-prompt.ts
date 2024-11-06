// this import cannot be from index.ts as it will break gelato-relayer
// by introducing node dependencies like fs which gelato doesn't have
import { runRelayer } from "@redstone-finance/on-chain-relayer/src/run-relayer";
import prompts, { PromptObject } from "prompts";
import { onCancel } from "../src/utils";
import { isUrl } from "../src/validations";

interface PromptResponse {
  networkName: string;
  networkRpcUrl: string;
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
      name: "networkRpcUrl",
      message: "Network RPC URL",
      validate: (value: string) => isUrl(value) || "Invalid URL",
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
      message: "Are fees two dimensional (yes for Arbitrum networks)",
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
    networkRpcUrl,
    interval,
    expectedTxDeliveryTimeInMS,
    twoDimensionalFees,
    privateKey,
    gasLimit,
  } = (await prompts(questions, { onCancel })) as PromptResponse;

  process.env.MANIFEST_FILE = `manifests/${networkName}MultiFeed.json`;
  process.env.RPC_URLS = JSON.stringify([networkRpcUrl]);
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
