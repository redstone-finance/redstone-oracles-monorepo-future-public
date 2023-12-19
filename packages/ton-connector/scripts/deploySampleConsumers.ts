import { NetworkProvider } from "@ton/blueprint";
import { TonNetwork, TonPriceFeed } from "../src";
import { TonSampleConsumerContractDeployer } from "../src/sample-consumer/TonSampleConsumerContractDeployer";
import { SampleConsumerInitData } from "../src/sample-consumer/SampleConsumerInitData";
import { deploy, loadAddress } from "../src/deploy";
import { TonSampleConsumer } from "../wrappers/TonSampleConsumer";
import { Cell } from "@ton/core";
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
