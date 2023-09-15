import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";
import { startSimpleRelayer } from "@redstone-finance/sdk";

// eslint-disable-next-line  @typescript-eslint/no-floating-promises -- Disabled for top-level functions
startSimpleRelayer(
  config,
  ContractConnectorFactory.makePriceManagerContractConnector()
);
