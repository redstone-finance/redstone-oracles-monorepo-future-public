import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleForLocalhostMockTest } from "../../typechain-types";

const dynamicDescribe =
  process.env.MONOREPO_INTEGRATION_TEST === "true" ? describe : describe.skip;

const getCacheServiceUrls = (): string[] => {
  if (process.env.CACHE_SERVICE_URLS) {
    return JSON.parse(process.env.CACHE_SERVICE_URLS) as string[];
  } else {
    return ["http://localhost:3000"];
  }
};

// This test is used in monorepo integration tests
dynamicDescribe("verify prices test", function () {
  let contract: SampleForLocalhostMockTest;
  const pricesToVerify = JSON.parse(process.env.PRICES_TO_CHECK ?? "[]") as {
    [token: string]: number;
  };
  const bytes32Symbols = Object.keys(pricesToVerify).map(formatBytes32String);
  const expectedPrices = Object.values(pricesToVerify);

  const testShouldPass = async (dataPackagesIds: string[]) => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
      dataServiceId: "mock-data-service",
      uniqueSignersCount: 1,
      dataPackagesIds,
      urls: getCacheServiceUrls(),
    });
    const oracleValues =
      await wrappedContract.extractOracleValuesView(bytes32Symbols);
    checkValues(oracleValues);
  };

  const checkValues = (values: BigNumber[]) => {
    console.log(`values from cache service: ${JSON.stringify(values)}`);
    expect(values.length).to.eq(
      expectedPrices.length,
      "the number of prices returned from contract does not equal expected number of prices"
    );
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).to.eq(
        BigNumber.from(expectedPrices[i] * 10 ** 8),
        `price for ${i} token is not what was expected`
      );
    }
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleForLocalhostMockTest"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly extract prices with small data packages", async () => {
    await testShouldPass(["ETH", "BTC", "AAVE"]);
  });

  it("Should properly extract prices with multi point package", async () => {
    await testShouldPass(["___COOL_TOKENS___"]);
  });
});
