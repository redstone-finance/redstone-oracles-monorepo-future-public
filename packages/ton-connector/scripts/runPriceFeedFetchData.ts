import { NetworkProvider } from "@ton/blueprint";
import {
  BlueprintTonNetwork,
  TonPriceFeed,
  TonPriceFeedContractConnector,
} from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";

export async function run(provider: NetworkProvider) {
  const connector = new TonPriceFeedContractConnector(
    new BlueprintTonNetwork(provider, config),
    await loadAddress(TonPriceFeed.getName())
  );
  const contract = await connector.getAdapter();

  await contract.fetchData();
  await connector.waitForTransaction("");

  console.log(await contract.getData());
}
