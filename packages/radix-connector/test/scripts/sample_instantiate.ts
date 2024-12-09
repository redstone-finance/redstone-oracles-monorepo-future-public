import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import fs from "fs";
import { PriceAdapterRadixContractDeployer, RadixClient } from "../../src";
import {
  DATA_SERVICE_ID,
  getFilename,
  loadAddress,
  NETWORK,
  PRIVATE_KEY,
} from "./constants";

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);
  const connector = new PriceAdapterRadixContractDeployer(
    client,
    await loadAddress(`package.${NETWORK.name}.addr`),
    1,
    getSignersForDataServiceId(DATA_SERVICE_ID)!
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await fs.promises.writeFile(
    getFilename(`component.${NETWORK.name}.addr`),
    componentId
  );
}

void instantiate();
