import { Contract, utils } from "ethers";
import { getProvider } from "../utils";
import abi from "../config/price-feed.abi.json";

(async () => {
  const provider = getProvider();
  const priceFeedContract = new Contract("price-feed-address", abi, provider);
  const latestRoundData = await priceFeedContract.latestRoundData();
  const price = utils.formatUnits(latestRoundData.answer, 8);
  console.log(price);
})();
