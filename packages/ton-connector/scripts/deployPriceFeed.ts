import { NetworkProvider } from "@ton/blueprint";
import * as fs from "fs";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";
import { TonNetwork, TonPriceFeed } from "../src";
import { deploy } from "../src/deploy";
import { Cell } from "@ton/core";

export async function run(provider: NetworkProvider) {
  const managerAddress = await fs.promises.readFile(
    `deploy/price_manager.address`,
    "utf8"
  );

  await deploy(
    TonPriceFeed.getName(),
    provider,
    (network: TonNetwork, code: Cell) => {
      return new TonPriceFeedContractDeployer(
        network,
        code,
        new PriceFeedInitData("ETH", managerAddress)
      );
    }
  );
}
