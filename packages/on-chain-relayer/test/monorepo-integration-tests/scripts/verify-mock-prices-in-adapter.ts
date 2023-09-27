import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { PriceFeedsAdapterWithoutRounds } from "../../../typechain-types";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const ContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapterWithoutRoundsOneSignerMock"
  );
  const contract: PriceFeedsAdapterWithoutRounds = ContractFactory.attach(
    process.env.ADAPTER_CONTRACT_ADDRESS ?? ""
  ) as PriceFeedsAdapterWithoutRounds;

  console.log("adapter contract address", process.env.ADAPTER_CONTRACT_ADDRESS);

  const pricesToVerify = JSON.parse(process.env.PRICES_TO_CHECK!) as {
    [token: string]: number;
  };
  const bytes32Symbols = Object.keys(pricesToVerify).map(formatBytes32String);
  const oracleValues = await contract.getValuesForDataFeeds(bytes32Symbols);

  let oracleValuesIndex = 0;
  for (const symbol of Object.keys(pricesToVerify)) {
    const expectedPrice = pricesToVerify[symbol] * 10 ** 8;
    if (!BigNumber.from(expectedPrice).eq(oracleValues[oracleValuesIndex])) {
      throw new Error(
        `${symbol}: price in adapter(${oracleValues[
          oracleValuesIndex
        ].toString()}) doesn't match with expected price (${expectedPrice})`
      );
    }
    oracleValuesIndex++;
  }
})();
