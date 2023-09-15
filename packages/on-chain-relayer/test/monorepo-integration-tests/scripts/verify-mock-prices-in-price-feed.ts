import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const ContractFactory = await ethers.getContractFactory(
    "PriceFeedWithoutRoundsMock",
  );
  const contract = ContractFactory.attach(
    process.env.PRICE_FEED_CONTRACT_ADDRESS ?? "",
  );

  console.log("price feed address", process.env.PRICE_FEED_CONTRACT_ADDRESS);

  const pricesToVerify = JSON.parse(process.env.PRICES_TO_CHECK!) as {
    [token: string]: number;
  };

  const dataFeedId = ethers.utils.parseBytes32String(
    await contract.getDataFeedId(),
  );
  const lastPrice = await contract.latestRoundData();
  const decimals = await contract.decimals();

  expect(
    pricesToVerify,
    "price feed contract does not provide any of expected prices",
  ).to.have.property(dataFeedId);

  const expectedPrice = BigNumber.from(10)
    .pow(decimals)
    .mul(pricesToVerify[dataFeedId]);

  expect(lastPrice.answer).to.eq(expectedPrice);
})();
