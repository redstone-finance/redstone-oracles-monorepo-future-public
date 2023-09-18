import { compile, NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { PriceManagerInitData } from "../src/price-manager/PriceManagerInitData";
import { TonPriceManagerContractDeployer } from "../src/price-manager/TonPriceManagerContractDeployer";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";
import * as fs from "fs";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const code = await compile("price_manager");

  const contract = await new TonPriceManagerContractDeployer(
    new BlueprintTonNetwork(provider, config),
    code,
    new PriceManagerInitData(1, [
      "0x109B4A318A4F5DDCBCA6349B45F881B4137DEAFB",
      "0x12470F7ABA85C8B81D63137DD5925D6EE114952B",
      "0x1EA62D73EDF8AC05DFCEA1A34B9796E937A29EFF",
      "0x2C59617248994D12816EE1FA77CE0A64EEB456BF",
      "0x83CBA8C619FB629B81A65C2E67FE15CF3E3C9747",
      "0xf786a909d559f5dee2dc6706d8e5a81728a39ae9",
    ])
  ).getAdapter();

  const address = contract.contract.address.toString();

  console.log(
    await fs.promises.writeFile(
      `deploy/price_manager.address`,
      address.toString()
    )
  );
}
