import { ethers } from "hardhat";
import fs from "fs";

const PRICE_FEED_ADDRESS_FILENAME = "price-feed-contract-address.txt";

(async () => {
  const priceFeedContractFactory = await ethers.getContractFactory(
    "PriceFeedWithoutRoundsMock"
  );
  const priceFeedContract = await priceFeedContractFactory.deploy();
  const adapterContractAddress = process.env.ADAPTER_CONTRACT_ADDRESS;
  if (!adapterContractAddress) {
    throw new Error("deploying price feed mock contract requires ADAPTER_CONTRACT_ADDRESS");
  }
  priceFeedContract.setAdapterAddress(adapterContractAddress);
  fs.writeFileSync(PRICE_FEED_ADDRESS_FILENAME, priceFeedContract.address);
})();
