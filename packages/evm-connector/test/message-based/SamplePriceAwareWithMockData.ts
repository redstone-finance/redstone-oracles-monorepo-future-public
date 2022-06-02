// import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";

describe("SamplePriceAwareWithMockData", function () {
  it("Generate sign a new data package and sign it", async function () {
    const SamplePriceAwareWithMockData = await ethers.getContractFactory(
      "SamplePriceAwareWithMockData"
    );
    const sampleMockContract = await SamplePriceAwareWithMockData.deploy();
    await sampleMockContract.deployed();

    const wrappedContract = WrapperBuilder.wrap(
      sampleMockContract
    ).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "ETH", value: 42 }],
    });

    const result = await wrappedContract.getEthPriceSecurely();
    console.log(result.toNumber());
  });
});
