import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import {
  DEFAULT_GAS_BUDGET,
  makeSuiClient,
  makeSuiKeypair,
  readSuiConfig,
  SuiNetworkSchema,
  SuiPricesContractConnector,
} from "../src";

async function main() {
  const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 3,
    dataPackagesIds: ["BTC"],
  });

  const suiClient = makeSuiClient(network);
  const suiContractConnector = new SuiPricesContractConnector(
    suiClient,
    {
      ...readSuiConfig(network),
      writePricesTxGasBudget: 10n * DEFAULT_GAS_BUDGET,
    },
    makeSuiKeypair()
  );

  await sampleRun(paramsProvider, suiContractConnector);
}

void main();
