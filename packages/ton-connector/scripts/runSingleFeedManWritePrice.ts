import { NetworkProvider } from "@ton/blueprint";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonSingleFeedManContractConnector } from "../src/single-feed-man/TonSingleFeedManContractConnector";
import { BlueprintTonNetwork } from "../src";
import { config } from "../src/config";
import { loadAddress } from "../src/deploy";
import { TonSingleFeedMan } from "../wrappers/TonSingleFeedMan";

export async function run(provider: NetworkProvider) {
  const connector = new TonSingleFeedManContractConnector(
    new BlueprintTonNetwork(provider, config),
    await loadAddress(TonSingleFeedMan.getName())
  );
  const contract = await connector.getAdapter();

  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 4,
    dataFeeds: ["ETH"],
  });

  console.log(await contract.writePriceFromPayloadToContract(paramsProvider));

  await connector.waitForTransaction("");

  console.log(await contract.readPriceAndTimestampFromContract());
}
