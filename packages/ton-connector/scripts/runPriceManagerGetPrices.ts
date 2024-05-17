import { ContractParamsProvider } from "@redstone-finance/sdk";
import { NetworkProvider } from "@ton/blueprint";
import { BlueprintTonNetwork, TonPriceManager } from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";
import { TonPriceManagerContractConnector } from "../src/price-manager/TonPriceManagerContractConnector";

export async function run(provider: NetworkProvider) {
  const contract = await new TonPriceManagerContractConnector(
    new BlueprintTonNetwork(provider, config),
    await loadAddress(TonPriceManager.getName())
  ).getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-rapid-demo",
    uniqueSignersCount: 1,
    dataPackagesIds: ["BTC", "ETH", "BNB", "AR", "AVAX", "CELO"],
  });

  console.log(await contract.getPricesFromPayload(paramsProvider));
}
