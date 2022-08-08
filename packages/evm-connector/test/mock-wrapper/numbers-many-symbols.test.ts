import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { getMockNumericPackage, getRange } from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerMockManySymbols } from "../../typechain-types";

const NUMBER_OF_MOCK_SIGNERS = 10;

describe("SampleRedstoneConsumerMockManySymbols", function () {
  let contract: SampleRedstoneConsumerMockManySymbols;

  const mockDataConfig = [
    getMockNumericPackage({
      mockSignerIndex: 0,
      dataPoints: [
        { dataFeedId: "BTC", value: 412 },
        { dataFeedId: "ETH", value: 41 },
      ],
    }),
    getMockNumericPackage({
      mockSignerIndex: 1,
      dataPoints: [
        { dataFeedId: "BTC", value: 390 },
        { dataFeedId: "ETH", value: 42 },
      ],
    }),
    getMockNumericPackage({
      mockSignerIndex: 2,
      dataPoints: [
        { dataFeedId: "BTC", value: 400 },
        { dataFeedId: "ETH", value: 43 },
      ],
    }),
    ...getRange({ start: 3, length: NUMBER_OF_MOCK_SIGNERS - 3 }).map(
      (mockSignerIndex: any) =>
        getMockNumericPackage({
          mockSignerIndex,
          dataPoints: [
            { dataFeedId: "BTC", value: 400 },
            { dataFeedId: "ETH", value: 42 },
          ],
        })
    ),
  ];

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbols"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("ETH"),
      utils.convertStringToBytes32("BTC"),
    ]);
    await tx.wait();

    const ethPriceFromContract = await contract.firstValue();
    const btcPriceFromContract = await contract.secondValue();
    expect(ethPriceFromContract.toNumber()).to.be.equal(42 * 10 ** 8);
    expect(btcPriceFromContract.toNumber()).to.be.equal(400 * 10 ** 8);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("BTC"),
      utils.convertStringToBytes32("ETH"),
    ]);
    await tx.wait();

    const btcPriceFromContract = await contract.firstValue();
    const ethPriceFromContract = await contract.secondValue();
    expect(btcPriceFromContract.toNumber()).to.be.equal(400 * 10 ** 8);
    expect(ethPriceFromContract.toNumber()).to.be.equal(42 * 10 ** 8);
  });

  // TODO: maybe move "should revert" tests to a separate module
  // And include it in almost each test

  // TODO: implement
  it("Should revert for too old timestamp", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for unauthorised signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for insufficient number of signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("[Maybe delete this test] Should revert for too big number of signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    expect(2 + 2).to.eq(4);
  });
});
