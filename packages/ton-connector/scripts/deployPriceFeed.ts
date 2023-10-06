import { compile, NetworkProvider } from "@ton-community/blueprint";
import * as fs from "fs";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";

export async function run(provider: NetworkProvider) {
  const managerAddress = await fs.promises.readFile(
    `deploy/price_manager.address`,
    "utf8"
  );

  const code = await compile("price_feed");

  const contract = await new TonPriceFeedContractDeployer(
    new BlueprintTonNetwork(provider, config),
    code,
    new PriceFeedInitData("ETH", managerAddress)
  ).getAdapter();

  const address = contract.contract.address.toString();

  console.log(
    await fs.promises.writeFile(`deploy/price_feed.address`, address.toString())
  );
}
