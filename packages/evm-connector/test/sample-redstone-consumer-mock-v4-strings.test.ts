import { arrayify, hexlify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DataPackage, DataPoint } from "redstone-protocol";
import { convertStringToBytes32 } from "redstone-protocol/dist/src/common/utils";
import {
  MOCK_SIGNERS,
  MockSignerIndex,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfigV2 } from "../src/wrappers/MockWrapperV2";
import { SampleRedstoneConsumerMockV4Strings } from "../typechain-types";

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
const DEFAULT_TIMESTAMP_FOR_TESTS = 1654353400000;
const DEFAULT_SYMBOL = "SOME LONG STRING FOR SYMBOL TO TRIGGER SYMBOL HASHING";
// const DEFAULT_SYMBOL = "ETH";
const DEFAULT_SYMBOL_BYTES_32 = convertStringToBytes32(DEFAULT_SYMBOL);

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  value: string;
  symbol?: string;
  timestampMilliseconds?: number;
}

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfigV2 {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const bytesValue = arrayify(opts.value);
  const dataPoints = [new DataPoint(opts.symbol || DEFAULT_SYMBOL, bytesValue)];
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
}

describe("SampleRedstoneConsumerMockV4Strings", function () {
  const someValue = "0x" + "f".repeat(1984) + "ee42"; // some long value
  let contract: SampleRedstoneConsumerMockV4Strings;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockV4Strings"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: someValue }),
      getMockPackage({ mockSignerIndex: 1, value: someValue }),
      getMockPackage({ mockSignerIndex: 2, value: someValue }),
    ]);

    const tx = await wrappedContract.saveLatestValueInStorage(
      DEFAULT_SYMBOL_BYTES_32
    );
    await tx.wait();

    const latestString = await contract.latestString();
    expect(latestString).to.be.equal(someValue);
  });

  it("Should revert if values from different signers are different", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: someValue }),
      getMockPackage({ mockSignerIndex: 1, value: someValue }),
      getMockPackage({
        mockSignerIndex: 2,
        value: someValue.replace("ee42", "ff42"),
      }),
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_SYMBOL_BYTES_32)
    ).to.be.revertedWith(
      "Each authorised signer must provide exactly the same bytes value"
    );
  });

  it("Should revert if there are too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_SYMBOL_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  it("Should revert if there are too few unique signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
      getMockPackage({ mockSignerIndex: 1, value: "0xf4610900" }),
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_SYMBOL_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });
});
