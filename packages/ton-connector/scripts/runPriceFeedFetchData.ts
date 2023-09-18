import { NetworkProvider } from "@ton-community/blueprint";
import * as dotenv from "dotenv";
import { TonPriceFeedContractConnector } from "../src/price-feed/TonPriceFeedContractConnector";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";
import * as fs from "fs";

export async function run(provider: NetworkProvider) {
  dotenv.config();

  const contract = await new TonPriceFeedContractConnector(
    new BlueprintTonNetwork(provider, config),
    await fs.promises.readFile(`deploy/price_feed.address`, "utf8")
  ).getAdapter();

  await contract.fetchData();
}
