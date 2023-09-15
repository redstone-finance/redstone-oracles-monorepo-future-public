import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { PriceFeedsAdapterWithoutRounds } from "../../../typechain-types";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const ContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapterWithoutRoundsOneSignerMock",
  );
  const contract: PriceFeedsAdapterWithoutRounds = ContractFactory.attach(
    process.env.ADAPTER_CONTRACT_ADDRESS ?? "",
  ) as PriceFeedsAdapterWithoutRounds;

  console.log("adapter contract address", process.env.ADAPTER_CONTRACT_ADDRESS);

  const pricesToVerify = JSON.parse(process.env.PRICES_TO_CHECK!) as {
    [token: string]: number;
  };
  const bytes32Symbols = Object.keys(pricesToVerify).map(formatBytes32String);
  const expectedPrices = Object.values(pricesToVerify);

  const oracleValues = await contract.getValuesForDataFeeds(bytes32Symbols);
  expect(oracleValues.length).to.eq(expectedPrices.length);
  for (let i = 0; i < oracleValues.length; i++) {
    expect(oracleValues[i]).to.eq(BigNumber.from(expectedPrices[i] * 10 ** 8));
  }
})();
