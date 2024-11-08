import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import { DataPackageSubscriber, Mqtt5Client, MultiPubSubClient } from "../src";
import { calculateTopicCountPerConnection } from "../src/topics";

const ENDPOINT = "a263ekd4nmsrss-ats.iot.eu-west-1.amazonaws.com";

async function main() {
  const mqttClientFactory = () =>
    Mqtt5Client.create({
      endpoint: ENDPOINT,
      authorization: {
        type: "AWSSigV4",
      },
    });

  const multiClient = new MultiPubSubClient(
    mqttClientFactory,
    calculateTopicCountPerConnection()
  );

  const dataPackageSubscriber = new DataPackageSubscriber(multiClient, {
    dataServiceId: "redstone-primary-prod",
    dataPackageIds: [
      "BTC",
      "USDC",
      "USDT",
      "WBTC",
      "ARB",
      "SolvBTC_MERLIN",
      "ETH",
      "pufETH",
      "STONE",
      "MANTA",
      "ezETH",
      "ZKL",
      "BBUSD",
      "BBTC",
      "GHO",
    ],
    uniqueSignersCount: 2,
    minimalOffChainSignersCount: 3,
    waitMsForOtherSignersAfterMinimalSignersCountSatisfied: 100,
    ignoreMissingFeeds: true,
    authorizedSigners: getSignersForDataServiceId("redstone-primary-prod")!,
  });

  await dataPackageSubscriber.subscribe(() => {});
}

void main();
