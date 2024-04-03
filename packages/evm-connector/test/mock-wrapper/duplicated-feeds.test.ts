import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import { getRange } from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { SampleDuplicatedDataFeeds } from "../../typechain-types";
import { expectedNumericValues, mockNumericPackages } from "../tests-common";

describe("DuplicatedDataFeeds", function () {
  let contract: SampleDuplicatedDataFeeds;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleDuplicatedDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  const runTestForArrayOfDataFeeds = async (dataFeedIds: string[]) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const tx = await wrappedContract.saveOracleValuesInStorage(
      dataFeedIds.map(utils.convertStringToBytes32)
    );
    await tx.wait();

    const values = await contract.getValuesFromStorage();
    for (let symbolIndex = 0; symbolIndex < dataFeedIds.length; symbolIndex++) {
      const symbol = dataFeedIds[symbolIndex];
      expect(values[symbolIndex].toNumber()).to.eql(
        expectedNumericValues[symbol]
      );
    }
  };

  it("Should get oracle values for empty array", async () => {
    await runTestForArrayOfDataFeeds([]);
  });

  it("Should get oracle values for an array with one symbol", async () => {
    await runTestForArrayOfDataFeeds(["ETH"]);
  });

  it("Should get oracle values for feeds with duplicates", async () => {
    await runTestForArrayOfDataFeeds([
      "ETH",
      "BTC",
      "ETH",
      "ETH",
      "BTC",
      "ETH",
      "BTC",
    ]);
  });

  it("Should get oracle values for feeds with duplicates (100 times BTC)", async () => {
    const dataFeedIds = getRange({ start: 0, length: 100 }).map(() => "BTC");
    await runTestForArrayOfDataFeeds(dataFeedIds);
  });

  it("Should get oracle values for feeds with duplicates (1000 times ETH)", async () => {
    const dataFeedIds = getRange({ start: 0, length: 1000 }).map(() => "ETH");
    await runTestForArrayOfDataFeeds(dataFeedIds);
  });

  it("Should get oracle values for feeds with duplicates (1 x ETH, 100 x BTC)", async () => {
    const dataFeedIds = getRange({ start: 0, length: 100 }).map(() => "BTC");
    await runTestForArrayOfDataFeeds(["ETH", ...dataFeedIds]);
  });

  it("Should get oracle values for feeds with duplicates (100 x BTC, 1 x ETH)", async () => {
    const dataFeedIds = getRange({ start: 0, length: 100 }).map(() => "BTC");
    await runTestForArrayOfDataFeeds([...dataFeedIds, "ETH"]);
  });

  it("Should get oracle values for feeds with duplicates (100 x ETH, 1 x BTC)", async () => {
    const dataFeedIds = getRange({ start: 0, length: 100 }).map(() => "ETH");
    await runTestForArrayOfDataFeeds([...dataFeedIds, "BTC"]);
  });

  it("Should get oracle values for feeds with duplicates (100 x ETH, 100 x BTC)", async () => {
    const dataFeedIdsETH = getRange({ start: 0, length: 100 }).map(() => "ETH");
    const dataFeedIdsBTC = getRange({ start: 0, length: 100 }).map(() => "BTC");
    await runTestForArrayOfDataFeeds([...dataFeedIdsETH, ...dataFeedIdsBTC]);
  });
});
