import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DataPackage, DataPoint, utils } from "redstone-protocol";
import {
  MOCK_SIGNERS,
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MockSignerIndex,
  MockSignerAddress,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerBytesMock } from "../../typechain-types";

const DEFAULT_SYMBOL = "SOME LONG STRING FOR SYMBOL TO TRIGGER SYMBOL HASHING";
const DEFAULT_SYMBOL_BYTES_32 = utils.convertStringToBytes32(DEFAULT_SYMBOL);

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  value: string;
  symbol?: string;
  timestampMilliseconds?: number;
}

const getMockPackage = (opts: MockPackageOpts): MockDataPackageConfig => {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const bytesValue = arrayify(opts.value);
  const dataPoints = [new DataPoint(opts.symbol || DEFAULT_SYMBOL, bytesValue)];
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
};

describe("SampleRedstoneConsumerBytesMock", function () {
  let contract: SampleRedstoneConsumerBytesMock;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: "0xf4610900" }), // hex(41 * 10 ** 8)
      getMockPackage({ mockSignerIndex: 1, value: "0x01004ccb00" }), // hex(43 * 10 ** 8)
      getMockPackage({ mockSignerIndex: 2, value: "0xfa56ea00" }), // hex(42 * 10 ** 8)
    ]);

    const tx = await wrappedContract.saveLatestPriceInStorage(
      DEFAULT_SYMBOL_BYTES_32
    );
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestPrice();
    expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  });

  it("Should revert if there are too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
    ]);

    await expect(
      wrappedContract.saveLatestPriceInStorage(DEFAULT_SYMBOL_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  it("Should revert if there are too few unique signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
    ]);

    await expect(
      wrappedContract.saveLatestPriceInStorage(DEFAULT_SYMBOL_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });
});
