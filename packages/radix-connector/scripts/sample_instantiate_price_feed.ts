import { RadixClient } from "../src";
import { PriceFeedRadixContractDeployer } from "../src/contracts/price_feed/PriceFeedRadixContractDeployer";
import {
  loadAddress,
  MULTI_FEED_PRICE_ADAPTER_NAME,
  NETWORK,
  PRICE_FEED_NAME,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);
  const connector = new PriceFeedRadixContractDeployer(
    client,
    await loadAddress(`package`, PRICE_FEED_NAME),
    await loadAddress(`component`, MULTI_FEED_PRICE_ADAPTER_NAME),
    "ETH"
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await saveAddress(`component`, PRICE_FEED_NAME, componentId);
}

void instantiate();
