import {
  ContractParamsProvider,
  convertValue,
  describeContractData,
  describeTimestamp,
  sampleRun,
} from "@redstone-finance/sdk";
import {
  MultiFeedPriceAdapterRadixContractConnector,
  PriceFeedRadixContractConnector,
  RadixClient,
} from "../src";
import {
  DATA_SERVICE_ID,
  FEED_ID,
  loadAddress,
  MULTI_FEED_PRICE_ADAPTER_NAME,
  NETWORK,
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

  const connector = new MultiFeedPriceAdapterRadixContractConnector(
    client,
    await loadAddress(`component`, MULTI_FEED_PRICE_ADAPTER_NAME)
  );
  const priceAdapter = await connector.getAdapter();

  const priceFeed = new PriceFeedRadixContractConnector(
    client,
    await loadAddress(`component`, PROXY_NAME, FEED_ID)
  );

  await sampleRun(paramsProvider, connector, priceFeed);

  priceAdapter.readMode = "CallReadMethod";
  const timestampRead = await priceAdapter.readTimestampFromContract(
    paramsProvider.getDataFeedIds()[0]
  );
  console.log(
    `Timestamp read by using method read_timestamp: ${timestampRead} (${describeTimestamp(timestampRead)})`
  );
  console.log(
    `Values read by using method read_prices: \n${(
      await priceAdapter.readPricesFromContract(paramsProvider)
    )
      .map(convertValue)
      .toString()}`
  );
  console.log(
    `Values read by using method read_price_data ${describeContractData(
      await priceAdapter.readContractData(paramsProvider.getDataFeedIds())
    )}`
  );
}

void main();
