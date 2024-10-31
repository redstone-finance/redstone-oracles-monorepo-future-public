import { getSignersForDataServiceId } from "@redstone-finance/oracles-smartweave-contracts";
import { DataPackageSubscriber, Mqtt5Client } from "../src";

const ENDPOINT = "a263ekd4nmsrss-ats.iot.eu-west-1.amazonaws.com";

async function main() {
  const mqttClient = await Mqtt5Client.create({
    endpoint: ENDPOINT,
    authorization: {
      type: "AWSSigV4",
    },
  });

  const dataPackageSubscriber = new DataPackageSubscriber(mqttClient, {
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
    waitMsForOtherSignersAfterMinimalSignersCountSatisfied: 1000,
    ignoreMissingFeeds: true,
    authorizedSigners: getSignersForDataServiceId("redstone-primary-prod")!,
  });

  await dataPackageSubscriber.subscribe(() => {});
}

void main();
