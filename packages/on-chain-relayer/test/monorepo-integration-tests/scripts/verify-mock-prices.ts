import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { PriceFeedsAdapterWithoutRounds } from "../../../typechain-types";

(async () => {
  const ContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapterWithoutRoundsOneSignerMock"
  );
  const contract: PriceFeedsAdapterWithoutRounds = ContractFactory.attach(
    process.env.ADAPTER_CONTRACT_ADDRESS ?? ""
  );

  console.log("adapter contract address", process.env.ADAPTER_CONTRACT_ADDRESS);

  const bytes32Symbols = ["ETH", "BTC", "AAVE"].map(formatBytes32String);
  // we expect prices to come from mock fetcher
  // https://raw.githubusercontent.com/redstone-finance/redstone-mock-prices/main/mock-prices.json
  const expectedValues = [1500, 16000, 42];
  const oracleValues = await contract.getValuesForDataFeeds(bytes32Symbols);
  expect(oracleValues.length === expectedValues.length);
  for (let i = 0; i < oracleValues.length; i++) {
    expect(oracleValues[i]).to.eq(BigNumber.from(expectedValues[i] * 10 ** 8));
  }
})();
