import { config } from "./config";
import { ContractConnectorFactory } from "./starknet/ContractConnectorFactory";
import { startSimpleRelayer } from "redstone-sdk";

(async () => {
  await startSimpleRelayer(
    config,
    ContractConnectorFactory.makePriceManagerContractConnector()
  );
})();
