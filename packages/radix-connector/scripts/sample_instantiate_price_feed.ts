import { PriceFeedRadixContractDeployer, RadixClient } from "../src";
import {
  FEED_ID,
  loadAddress,
  MULTI_FEED_PRICE_ADAPTER_NAME,
  NETWORK,
  PRICE_FEED_NAME,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(NETWORK.id, PRIVATE_KEY);
  const connector = new PriceFeedRadixContractDeployer(
    client,
    await loadAddress(`package`, PRICE_FEED_NAME),
    await loadAddress(`component`, MULTI_FEED_PRICE_ADAPTER_NAME),
    FEED_ID
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await saveAddress(`component`, PRICE_FEED_NAME, componentId, FEED_ID);
}

void instantiate();
