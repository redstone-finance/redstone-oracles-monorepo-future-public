import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import dotenv from "dotenv";
import { SuiContractConnector } from "../src/SuiContractConnector";
import { NetworkEnum } from "../src/config";
import { makeSuiClient, makeSuiKeypair, readSuiConfig } from "../src/util";

async function main() {
  dotenv.config();
  const network = RedstoneCommon.getFromEnv("NETWORK", NetworkEnum);

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 3,
    dataPackagesIds: ["LBTC", "BTC", "ETH"],
  });
  const suiContractConnector = new SuiContractConnector(
    makeSuiClient(network),
    readSuiConfig(network),
    makeSuiKeypair()
  );

  await sampleRun(paramsProvider, suiContractConnector);
}

void main();
