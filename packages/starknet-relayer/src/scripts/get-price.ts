import { utils } from "ethers";
import { priceFeedAddresses } from "../config/price-feed-addresses";
import { ContractConnectorFactory } from "../starknet/ContractConnectorFactory";
import { config } from "../config";
import { getNumberFromStarknet } from "@redstone-finance/starknet-connector";

const priceFeeds = priceFeedAddresses[config.priceManagerVersion];

(async () => {
  for (const feedAddress of [priceFeeds.BTC, priceFeeds.ETH]) {
    try {
      const latestRoundData = await (
        await ContractConnectorFactory.makePriceFeedContractConnector(
          feedAddress
        ).getAdapter()
      ).readLatestRoundData();

      const price = utils.formatUnits(
        getNumberFromStarknet(latestRoundData.answer),
        8
      );

      console.log(price);
    } catch (e) {
      console.error(e);
    }
  }
})();
