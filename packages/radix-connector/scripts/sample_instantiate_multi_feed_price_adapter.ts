import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import {
  MultiFeedPriceAdapterRadixContractDeployer,
  RadixClient,
} from "../src";
import {
  DATA_SERVICE_ID,
  loadAddress,
  MULTI_FEED_PRICE_ADAPTER_NAME,
  NETWORK,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(NETWORK.id, PRIVATE_KEY);
  const connector = new MultiFeedPriceAdapterRadixContractDeployer(
    client,
    await loadAddress(`package`, MULTI_FEED_PRICE_ADAPTER_NAME),
    1,
    getSignersForDataServiceId(DATA_SERVICE_ID)!
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await saveAddress("component", MULTI_FEED_PRICE_ADAPTER_NAME, componentId);
}

void instantiate();
