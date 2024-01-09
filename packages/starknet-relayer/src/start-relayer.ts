import { startSimpleRelayer } from "@redstone-finance/sdk";
import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";

// eslint-disable-next-line  @typescript-eslint/no-floating-promises -- Disabled for top-level functions
startSimpleRelayer(
  config,
  ContractConnectorFactory.makePriceManagerContractConnector()
);
