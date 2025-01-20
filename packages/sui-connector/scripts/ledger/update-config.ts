import {
  makeSuiDeployConfig,
  readIds,
  readSuiConfig,
  SuiNetworkName,
  SuiPricesContractAdapter,
} from "../../src";
import { generateTransactionData } from "./generate-transaction-data";

void generateTransactionData((tx, network: SuiNetworkName) =>
  SuiPricesContractAdapter.updateConfig(
    tx,
    { ...readSuiConfig(network), ...makeSuiDeployConfig() },
    readIds(network).adminCapId
  )
);
