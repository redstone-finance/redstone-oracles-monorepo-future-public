import { Contract, utils } from "ethers";
import { getProvider } from "../core/contract-interactions/get-provider";
import { abi } from "../../artifacts/contracts/price-feeds/PriceFeed.sol/PriceFeed.json";

const PRICE_FEED_ADDRESS = "";

(async () => {
  const provider = getProvider();
  const priceFeedContract = new Contract(PRICE_FEED_ADDRESS, abi, provider);
  const latestRoundData = await priceFeedContract.latestRoundData();
  const price = utils.formatUnits(latestRoundData.answer, 8);
  console.log(price);
})();
