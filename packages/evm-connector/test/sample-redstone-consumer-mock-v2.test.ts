import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { SampleRedstoneConsumerMockV2 } from "../typechain-types";

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
const TIMESTAMP_FOR_TESTS = 1654353400000;

describe("SampleRedstoneConsumerMockV2", function () {
  let contract: SampleRedstoneConsumerMockV2;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockV2"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    // const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2({
    //   timestampMilliseconds: TIMESTAMP_FOR_TESTS,
    //   dataPoints: [{ symbol: "ETH", value: 42 }],
    // });
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      {
        signer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        dataPackage: {
          timestampMilliseconds: TIMESTAMP_FOR_TESTS,
          dataPoints: [{ symbol: "ETH", value: 41 }],
        },
      },
      {
        signer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        dataPackage: {
          timestampMilliseconds: TIMESTAMP_FOR_TESTS,
          dataPoints: [{ symbol: "ETH", value: 43 }],
        },
      },
      {
        signer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        dataPackage: {
          timestampMilliseconds: TIMESTAMP_FOR_TESTS,
          dataPoints: [{ symbol: "ETH", value: 42 }],
        },
      },
    ]);

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

  // it("Should properly execute transaction with a big dataPackage (30k data points)", async () => {
  //   // Prepare data points
  //   const dataPoints = [{ symbol: "ETH", value: 42 }];
  //   for (let i = 0; i < 30000; i++) {
  //     dataPoints.push({
  //       symbol: "SYMBOL" + i,
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
