import { NetworkProvider } from "@ton/blueprint";
import { BlueprintTonNetwork, TonPriceFeed } from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";
import { TonSampleConsumerContractConnector } from "../src/sample-consumer/TonSampleConsumerContractConnector";
import { TonSampleConsumer } from "../wrappers/TonSampleConsumer";
import { TonSingleFeedMan } from "../wrappers/TonSingleFeedMan";

export async function run(provider: NetworkProvider) {
  const names = [TonPriceFeed.getName(), TonSingleFeedMan.getName()];

  for (const name of names) {
    const connector = new TonSampleConsumerContractConnector(
      new BlueprintTonNetwork(provider, config),
      await loadAddress(TonSampleConsumer.getName(), name)
    );
    const contract = await connector.getAdapter();

    await contract.readData();
    await connector.waitForTransaction("");
  }
}
