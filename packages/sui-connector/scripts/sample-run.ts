import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import dotenv from "dotenv";
import {
  makeSuiClient,
  makeSuiKeypair,
  readSuiConfig,
  SuiNetworkSchema,
  SuiPricesContractConnector,
} from "../src";

async function main() {
  dotenv.config();
  const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 3,
    dataPackagesIds: ["LBTC", "BTC", "ETH"],
  });
  const suiContractConnector = new SuiPricesContractConnector(
    makeSuiClient(network),
    readSuiConfig(network),
    makeSuiKeypair()
  );

  await sampleRun(paramsProvider, suiContractConnector);
}

void main();
