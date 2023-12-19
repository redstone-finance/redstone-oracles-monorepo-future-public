import { NetworkProvider } from "@ton/blueprint";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonPriceManagerContractConnector } from "../src/price-manager/TonPriceManagerContractConnector";
import { BlueprintTonNetwork, TonPriceManager } from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";

export async function run(provider: NetworkProvider) {
  const contract = await new TonPriceManagerContractConnector(
    new BlueprintTonNetwork(provider, config),
    await loadAddress(TonPriceManager.getName())
  ).getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
    dataFeeds: ["ETH", "BTC", "USDT"],
  });

  console.log(await contract.readPricesFromContract(paramsProvider));
}
