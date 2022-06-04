import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { SamplePriceAwareMock } from "../typechain-types";

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
const TIMESTAMP_FOR_TESTS = 1654353400000;

describe("SamplePriceAwareMock", function () {
  let contract: SamplePriceAwareMock;

  it("Should properly deploy contract", async function () {
    const ContractFactory = await ethers.getContractFactory(
      "SamplePriceAwareMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on PriceAware contract", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: TIMESTAMP_FOR_TESTS,
      dataPoints: [{ symbol: "ETH", value: 42 }],
    });

    const tx = await wrappedContract.saveLatestEthPriceInStorage();
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestEthPrice();
    expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  });

  // it("Should properly read oracle data using contract view function", async () => {
  //   const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
  //     timestampMilliseconds: TIMESTAMP_FOR_TESTS,
  //     dataPoints: [{ symbol: "ETH", value: 43 }],
  //   });

  //   const result = await wrappedContract.getEthPriceSecurely();
  //   expect(result.div(10 ** 8).toNumber()).to.be.equal(43);
  // });

  // TODO: fix it for dataPointsCount > 1023
  // it("Should properly execute transaction with a big dataPackage (2k data points)", async () => {
  //   // Prepare data points
  //   const dataPoints = [{ symbol: "ETH", value: 42 }];
  //   for (let i = 0; i < 2000; i++) {
  //     dataPoints.push({
  //       symbol: "SYMBOL_" + i,
  //       value: i,
  //     });
  //   }

  //   const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
  //     timestampMilliseconds: TIMESTAMP_FOR_TESTS,
  //     dataPoints,
  //   });

  //   const tx = await wrappedContract.saveLatestEthPriceInStorage();
  //   await tx.wait();

  //   const latestEthPriceFromContract = await contract.latestEthPrice();
  //   expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  // });
});
