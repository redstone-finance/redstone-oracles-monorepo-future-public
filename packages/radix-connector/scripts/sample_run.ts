import {
  ContractParamsProvider,
  convertValue,
  describeTimestamp,
  sampleRun,
} from "@redstone-finance/sdk";
import { PriceAdapterRadixContractConnector, RadixClient } from "../src";
import { PriceFeedRadixContractConnector } from "../src/contracts/price_feed/PriceFeedRadixContractConnector";
import {
  DATA_SERVICE_ID,
  loadAddress,
  NETWORK,
  PRICE_ADAPTER_NAME,
  PRIVATE_KEY,
  PROXY_NAME,
} from "./constants";

async function main() {
  const paramsProvider = new ContractParamsProvider({
    dataPackagesIds: ["ETH", "BTC", "XRD"],
    dataServiceId: DATA_SERVICE_ID,
    uniqueSignersCount: 1,
  });

  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);

  const connector = new PriceAdapterRadixContractConnector(
    client,
    await loadAddress(`component`, PRICE_ADAPTER_NAME)
  );
  const priceAdapter = await connector.getAdapter();

  const priceFeed = new PriceFeedRadixContractConnector(
    client,
    await loadAddress(`component`, PROXY_NAME)
  );

  await sampleRun(paramsProvider, connector, priceFeed);

  priceAdapter.readMode = "CallReadMethod";
  const timestampRead = await priceAdapter.readTimestampFromContract();
  console.log(
    `Timestamp read by using method read_timestamp: ${timestampRead} (${describeTimestamp(timestampRead)})`
  );
  console.log(
    `Values read by using method read_prices ${(
      await priceAdapter.readPricesFromContract(paramsProvider)
    )
      .map(convertValue)
      .toString()}`
  );
}

void main();
