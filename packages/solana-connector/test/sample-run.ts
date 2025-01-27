import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Keypair } from "@solana/web3.js";
import dotenv from "dotenv";
import { SolanaContractConnector } from "../src";
import { connectionTo } from "../src/PriceContractAdapter";
import { hexToU8Array } from "../src/utils";

async function main() {
  dotenv.config();
  const url = RedstoneCommon.getFromEnv("URL");
  const secret = RedstoneCommon.getFromEnv("PRIVATE_KEY");

  const paramsProvider = new ContractParamsProvider({
    dataPackagesIds: ["ETH"],
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 3,
  });
  const connection = connectionTo(url);
  const keypair = Keypair.fromSecretKey(hexToU8Array(secret));

  const solanaContractConnector = new SolanaContractConnector(
    connection,
    keypair
  );

  await sampleRun(paramsProvider, solanaContractConnector);
}

void main();
