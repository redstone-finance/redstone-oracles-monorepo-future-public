import { expect } from "chai";
import { ethers } from "hardhat";
import { DataPackage, NumericDataPoint } from "redstone-protocol";
import {
  MOCK_SIGNERS,
  MockSignerIndex,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfigV2 } from "../src/wrappers/MockWrapperV2";
import { SampleRedstoneConsumerMockV2 } from "../typechain-types";

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
const DEFAULT_TIMESTAMP_FOR_TESTS = 1654353400000;
const DEFAULT_SYMBOL = "ETH";

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  value: number;
  symbol?: string;
  timestampMilliseconds?: number;
}

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfigV2 {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const dataPoints = [
    new NumericDataPoint({
      symbol: opts.symbol || DEFAULT_SYMBOL,
      value: opts.value,
    }),
  ];
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
}

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
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: 41 }),
      getMockPackage({ mockSignerIndex: 1, value: 43 }),
      getMockPackage({ mockSignerIndex: 2, value: 42 }),
      getMockPackage({ mockSignerIndex: 3, value: 42 }),
      getMockPackage({ mockSignerIndex: 4, value: 42 }),
      getMockPackage({ mockSignerIndex: 5, value: 42 }),
      getMockPackage({ mockSignerIndex: 6, value: 42 }),
      getMockPackage({ mockSignerIndex: 7, value: 41 }),
      getMockPackage({ mockSignerIndex: 8, value: 43 }),
      getMockPackage({ mockSignerIndex: 9, value: 42 }),
    ]);

    const tx = await wrappedContract.saveLatestEthPriceInStorage();
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestEthPrice();
    expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  });

  it("Should revert if there are too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: 100 }),
      getMockPackage({ mockSignerIndex: 1, value: 100 }),
    ]);

    await expect(
      wrappedContract.saveLatestEthPriceInStorage()
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  it("Should revert if there are too few unique signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({ mockSignerIndex: 0, value: 100 }),
      getMockPackage({ mockSignerIndex: 1, value: 100 }),
      getMockPackage({ mockSignerIndex: 1, value: 100 }),
    ]);

    await expect(
      wrappedContract.saveLatestEthPriceInStorage()
    ).to.be.revertedWith("Insufficient number of unique signers");
  });
});
