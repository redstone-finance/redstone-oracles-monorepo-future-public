import { FuelPricesContractAdapter } from "../src";
import { provider } from "./common/provider";
import { deployPricesContract } from "./prices/prices-contract-test-utils";

const IS_LOCAL = false as boolean;
const SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000012";

async function main() {
  const adapter = (await deployPricesContract(await provider(IS_LOCAL), {
    allowedSigners: [
      "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
      "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB",
      "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
      "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF",
      "0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
      "0xf786a909d559f5dee2dc6706d8e5a81728a39ae9",
    ],
    signerCountThreshold: 1,
    salt: SALT,
  })) as FuelPricesContractAdapter;

  console.log(`Deployed ${adapter.contract.id.toHexString()}`);
}

void main();
