import fs from "fs";
import { RadixClient } from "../../src";
import { PriceFeedRadixContractDeployer } from "../../src/contracts/price_feed/PriceFeedRadixContractDeployer";
import {
  getFilename,
  loadAddress,
  NETWORK,
  PRICE_ADAPTER_NAME,
  PRICE_FEED_NAME,
  PRIVATE_KEY,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);
  const connector = new PriceFeedRadixContractDeployer(
    client,
    await loadAddress(`package.${NETWORK.name}.addr`, PRICE_FEED_NAME),
    await loadAddress(`component.${NETWORK.name}.addr`, PRICE_ADAPTER_NAME),
    "ETH"
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await fs.promises.writeFile(
    getFilename(`component.${NETWORK.name}.addr`, PRICE_FEED_NAME),
    componentId
  );
}

void instantiate();
