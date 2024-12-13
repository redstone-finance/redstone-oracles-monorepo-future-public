import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import { PriceAdapterRadixContractDeployer, RadixClient } from "../src";
import {
  DATA_SERVICE_ID,
  loadAddress,
  NETWORK,
  PRICE_ADAPTER_NAME,
  PRIVATE_KEY,
  saveAddress,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);
  const connector = new PriceAdapterRadixContractDeployer(
    client,
    await loadAddress(`package`, PRICE_ADAPTER_NAME),
    1,
    getSignersForDataServiceId(DATA_SERVICE_ID)!
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await saveAddress("component", PRICE_ADAPTER_NAME, componentId);
}

void instantiate();
