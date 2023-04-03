import { config } from "../config";
import { utils } from "ethers";
import { priceFeedAddresses } from "../config/price-feed-addresses";
import { StarknetPriceFeedContractConnector } from "../starknet/StarknetPriceFeedContractConnector";

(async () => {
  for (const feedAddress of [priceFeedAddresses.BTC, priceFeedAddresses.ETH]) {
    try {
      const latestRoundData = await (
        await new StarknetPriceFeedContractConnector(
          config,
          feedAddress
        ).getAdapter()
      ).readLatestRoundData();

      const price = utils.formatUnits(latestRoundData.answer.toNumber(), 8);

      console.log(price);
    } catch (e) {
      console.log(e);
    }
  }
})();
