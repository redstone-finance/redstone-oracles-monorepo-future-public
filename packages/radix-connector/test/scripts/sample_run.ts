import {
  ContractParamsProvider,
  convertValue,
  describeTimestamp,
  sampleRun,
} from "@redstone-finance/sdk";
import { PriceAdapterRadixContractConnector, RadixClient } from "../../src";
import { loadAddress, NETWORK, PRIVATE_KEY } from "./constants";

async function main() {
  const paramsProvider = new ContractParamsProvider({
    dataPackagesIds: ["ETH", "BTC"],
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
  });

  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);

  const connector = new PriceAdapterRadixContractConnector(
    client,
    await loadAddress(`component.${NETWORK.name}.addr`)
  );

  const adapter = await connector.getAdapter();

  await sampleRun(paramsProvider, connector);

  const timestampRead = await adapter.readTimestampFromContractWithMethod();
  console.log(
    `Timestamp read by using method read_timestamp: ${timestampRead} (${describeTimestamp(timestampRead)})`
  );
  console.log(
    `Values read by using method read_prices ${(
      await adapter.readPricesFromContractWithMethod(paramsProvider)
    )
      .map(convertValue)
      .toString()}`
  );
}

void main();
