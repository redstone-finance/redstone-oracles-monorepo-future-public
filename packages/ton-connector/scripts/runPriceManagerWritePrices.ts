import { ContractParamsProvider } from "@redstone-finance/sdk";
import { NetworkProvider } from "@ton/blueprint";
import { BlueprintTonNetwork, TonPriceManager } from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";
import { TonPriceManagerContractConnector } from "../src/price-manager/TonPriceManagerContractConnector";

export async function run(provider: NetworkProvider) {
  const connector = new TonPriceManagerContractConnector(
    new BlueprintTonNetwork(provider, config),
    await loadAddress(TonPriceManager.getName())
  );
  const contract = await connector.getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 4,
    dataPackagesIds: ["BTC", "ETH", "USDT", "AVAX"],
  });

  console.log(await contract.writePricesFromPayloadToContract(paramsProvider));

  await connector.waitForTransaction("");

  console.log(await contract.readPricesFromContract(paramsProvider));
}
