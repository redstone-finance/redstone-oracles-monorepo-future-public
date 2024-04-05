import { sampleRun } from "@redstone-finance/sdk";
import {
  CasperConfig,
  makeCasperConnection,
  PriceRelayAdapterCasperContractConnector,
} from "../../src";
import { PriceFeedCasperContractConnector } from "../../src/contracts/price_feed/PriceFeedCasperContractConnector";
import { config } from "./config";
import {
  FEED_ADDRESS,
  makeContractParamsProvider,
  RELAY_ADAPTER_ADDRESS,
} from "./e2e-utils";

async function main(config: CasperConfig) {
  const connection = await makeCasperConnection(config);
  const pricesConnector = new PriceRelayAdapterCasperContractConnector(
    connection,
    RELAY_ADAPTER_ADDRESS
  );
  const paramsProvider = makeContractParamsProvider();
  await sampleRun(
    paramsProvider,
    pricesConnector,
    new PriceFeedCasperContractConnector(connection, FEED_ADDRESS),
    async () => {
      await connection.refreshStateRootHash();
    }
  );
}

void main(config);
