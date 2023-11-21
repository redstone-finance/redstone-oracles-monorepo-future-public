import { NetworkProvider } from "@ton-community/blueprint";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonPriceManagerContractConnector } from "../src/price-manager/TonPriceManagerContractConnector";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";
import * as fs from "fs";

export async function run(provider: NetworkProvider) {
  const connector = new TonPriceManagerContractConnector(
    new BlueprintTonNetwork(provider, config),
    await fs.promises.readFile(`deploy/price_manager.address`, "utf8")
  );
  const contract = await connector.getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 4,
    dataFeeds: ["BTC", "ETH", "USDT", "AVAX"],
  });

  console.log(await contract.writePricesFromPayloadToContract(paramsProvider));

  await connector.waitForTransaction("");

  console.log(await contract.readPricesFromContract(paramsProvider));
}
