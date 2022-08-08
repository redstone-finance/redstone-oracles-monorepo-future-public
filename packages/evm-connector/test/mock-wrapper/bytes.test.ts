import { expect } from "chai";
import { ethers } from "hardhat";
import {
  getMockPackageWithOneBytesDataPoint,
  DEFAULT_DATA_FEED_ID_BYTES_32,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerBytesMock } from "../../typechain-types";

describe("SampleRedstoneConsumerBytesMock", function () {
  let contract: SampleRedstoneConsumerBytesMock;

  const mockPackages = [
    getMockPackageWithOneBytesDataPoint({
      mockSignerIndex: 0,
      hexValue: "0xf4610900", // hex(41 * 10 ** 8)
    }),
    getMockPackageWithOneBytesDataPoint({
      mockSignerIndex: 1,
      hexValue: "0x01004ccb00", // hex(43 * 10 ** 8)
    }),
    getMockPackageWithOneBytesDataPoint({
      mockSignerIndex: 2,
      hexValue: "0xfa56ea00", // hex(42 * 10 ** 8)
    }),
  ];

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.saveLatestPriceInStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestPrice();
    expect(latestEthPriceFromContract.toNumber()).to.be.equal(42 * 10 ** 8);
  });

  it("Should revert if there are too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
      mockPackages[0],
      mockPackages[1],
    ]);

    await expect(
      wrappedContract.saveLatestPriceInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  it("Should revert if there are too few unique signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
      mockPackages[0],
      mockPackages[1],
      mockPackages[1],
    ]);

    await expect(
      wrappedContract.saveLatestPriceInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  // TODO: implement
  it("Should fail for too old timestamp", async () => {
    expect(2 + 2).to.eq(4);
  });
});
