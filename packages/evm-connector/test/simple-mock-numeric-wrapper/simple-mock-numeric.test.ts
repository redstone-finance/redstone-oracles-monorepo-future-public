import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DEFAULT_TIMESTAMP_FOR_TESTS } from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";

const dataPoints = [
  { dataFeedId: "ETH", value: 42 },
  { dataFeedId: "BTC", value: 400 },
];

describe("Simple Mock Numeric Wrapper", function () {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute on contract wrapped using simple numeric mock", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 10,
      dataPoints,
    });

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataPoints[0].dataFeedId),
      utils.convertStringToBytes32(dataPoints[1].dataFeedId),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      dataPoints[0].value * 10 ** 8
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      dataPoints[1].value * 10 ** 8
    );
  });

  it("Should properly execute on contract wrapped with smaller value byte size", async () => {
    const dataPointsWithValueByteSize = [
      { dataFeedId: "ETH", value: 42, valueByteSize: 32 },
      { dataFeedId: "BTC", value: 400, valueByteSize: 8 },
    ];

    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 10,
      dataPoints: dataPointsWithValueByteSize,
    });

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataPointsWithValueByteSize[0].dataFeedId),
      utils.convertStringToBytes32(dataPointsWithValueByteSize[1].dataFeedId),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      dataPointsWithValueByteSize[0].value * 10 ** 8
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      dataPointsWithValueByteSize[1].value * 10 ** 8
    );
  });

  it("Should properly execute on contract wrapped with smaller value byte size in one data point", async () => {
    const dataPointsWithValueByteSize = [
      { dataFeedId: "ETH", value: 42, valueByteSize: 13 },
      { dataFeedId: "BTC", value: 400 },
    ];

    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 10,
      dataPoints: dataPointsWithValueByteSize,
    });

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataPointsWithValueByteSize[0].dataFeedId),
      utils.convertStringToBytes32(dataPointsWithValueByteSize[1].dataFeedId),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      dataPointsWithValueByteSize[0].value * 10 ** 8
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      dataPointsWithValueByteSize[1].value * 10 ** 8
    );
  });

  it("Should revert for too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 9,
      dataPoints,
    });

    await expect(
      wrappedContract.save2ValuesInStorage([
        utils.convertStringToBytes32(dataPoints[0].dataFeedId),
        utils.convertStringToBytes32(dataPoints[1].dataFeedId),
      ])
    )
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(9, 10);
  });

  it("Should revert for too old timestamp", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 10,
      dataPoints,
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });

    await expect(
      wrappedContract.save2ValuesInStorage([
        utils.convertStringToBytes32(dataPoints[0].dataFeedId),
        utils.convertStringToBytes32(dataPoints[1].dataFeedId),
      ])
    )
      .to.be.revertedWith("TimestampIsNotValid")
      .withArgs();
  });

  it("Should test getting data with timestamp", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 10,
      dataPoints,
    });

    const tx = await wrappedContract.save2ValuesAndTimestampInStorage([
      utils.convertStringToBytes32(dataPoints[0].dataFeedId),
      utils.convertStringToBytes32(dataPoints[1].dataFeedId),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();
    const timestampFromContract = await contract.timestampFromData();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      dataPoints[0].value * 10 ** 8
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      dataPoints[1].value * 10 ** 8
    );
    expect(timestampFromContract.toNumber()).to.be.equal(1654353400000);
  });
});
