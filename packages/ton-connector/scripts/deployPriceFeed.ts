import { NetworkProvider } from "@ton/blueprint";
import { Cell } from "@ton/core";
import { TonNetwork, TonPriceFeed, TonPriceManager } from "../src";
import { deploy, loadAddress } from "../src/deploy";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";

export async function run(provider: NetworkProvider) {
  const managerAddress = await loadAddress(TonPriceManager.getName());

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
