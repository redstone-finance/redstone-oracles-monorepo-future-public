import { startSimpleRelayer } from "@redstone-finance/sdk";
import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";

void startSimpleRelayer(
  config,
  ContractConnectorFactory.makePriceManagerContractConnector()
);
