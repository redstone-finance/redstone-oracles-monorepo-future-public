import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonPriceManagerContractConnector } from "../src/price-manager/TonPriceManagerContractConnector";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";
import * as fs from "fs";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await new TonPriceManagerContractConnector(
    new BlueprintTonNetwork(provider, config),
    await fs.promises.readFile(`deploy/price_manager.address`, "utf8")
  ).getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
    dataFeeds: ["ETH", "BTC", "USDT"],
  });

  console.log(await contract.readPricesFromContract(paramsProvider));
}
