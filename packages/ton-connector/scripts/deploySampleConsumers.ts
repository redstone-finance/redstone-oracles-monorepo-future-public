import { NetworkProvider } from "@ton/blueprint";
import { Cell } from "@ton/core";
import { TonNetwork, TonPriceFeed } from "../src";
import { deploy, loadAddress } from "../src/deploy";
import { SampleConsumerInitData } from "../src/sample-consumer/SampleConsumerInitData";
import { TonSampleConsumerContractDeployer } from "../src/sample-consumer/TonSampleConsumerContractDeployer";
import { TonSampleConsumer } from "../wrappers/TonSampleConsumer";
import { TonSingleFeedMan } from "../wrappers/TonSingleFeedMan";

export async function run(provider: NetworkProvider) {
  const names = [TonPriceFeed.getName(), TonSingleFeedMan.getName()];

  for (const name of names) {
    const feedAddress = await loadAddress(name);
    await deploy(
      TonSampleConsumer.getName(),
      provider,
      (network: TonNetwork, code: Cell) => {
        return new TonSampleConsumerContractDeployer(
          network,
          code,
          new SampleConsumerInitData(feedAddress)
        );
      },
      name
    );
  }
}
