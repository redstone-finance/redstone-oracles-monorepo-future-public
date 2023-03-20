import { Starknet } from "../starknet/Starknet";
import { config } from "../config";
import { utils } from "ethers";
import { priceFeedAddresses } from "../config/price-feed-addresses";

const starknet = new Starknet(config);

(async () => {
  for (const feedAddress of [priceFeedAddresses.BTC, priceFeedAddresses.ETH]) {
    try {
      const latestRoundData = await starknet
          .latestRoundCommand(feedAddress)
          .execute();
      const price = utils.formatUnits(latestRoundData.answer.toNumber(), 8);

      console.log(price);
    } catch (e) {
      console.log(e);
    }
  }
})();
