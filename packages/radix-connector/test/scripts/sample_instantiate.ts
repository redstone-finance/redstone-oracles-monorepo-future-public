import fs from "fs";
import { RadixClient } from "../../src";
import { PriceAdapterRadixContractDeployer } from "../../src/contracts/price_adapter/PriceAdapterRadixContractDeployer";

import { getFilename, loadAddress, PRIVATE_KEY } from "./constants";

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY);
  const connector = new PriceAdapterRadixContractDeployer(
    client,
    await loadAddress("package.stokenet.addr"),
    1,
    [
      "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
      "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB",
      "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
      "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF",
      "0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
      "0xf786a909d559f5dee2dc6706d8e5a81728a39ae9",
    ]
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await fs.promises.writeFile(
    getFilename("component.stokenet.addr"),
    componentId
  );
}

void instantiate();
