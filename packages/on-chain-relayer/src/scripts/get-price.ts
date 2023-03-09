import { utils } from "ethers";
import { ethers } from "hardhat";

const PRICE_FEED_ADDRESS = "";

(async () => {
  const priceFeedFactory = await ethers.getContractFactory("PriceFeed");
  const priceFeedContract = priceFeedFactory.attach(PRICE_FEED_ADDRESS);
  const latestRoundData = await priceFeedContract.latestRoundData();
  const price = utils.formatUnits(latestRoundData.answer, 8);
  console.log(price);
})();
