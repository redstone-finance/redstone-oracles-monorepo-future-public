import { expect } from "chai";
import { ethers } from "hardhat";
import {
  FixedSizeDataPackage,
  INumericDataPoint,
  NumericDataPoint,
} from "redstone-protocol";
import {
  MOCK_SIGNERS,
  MockSignerIndex,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfigV2 } from "../src/wrappers/MockWrapperV2";
import { SampleRedstoneConsumerMockManySymbolsV2 } from "../typechain-types";

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
const DEFAULT_TIMESTAMP_FOR_TESTS = 1654353400000;

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  dataPoints: INumericDataPoint[];
  timestampMilliseconds?: number;
}

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfigV2 {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const dataPoints = opts.dataPoints.map(
    (dp) => new NumericDataPoint(dp.symbol, dp.value, dp.decimals, dp.byteSize)
  );
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new FixedSizeDataPackage(dataPoints, timestampMilliseconds),
  };
}

describe("SampleRedstoneConsumerMockManySymbolsV2", function () {
  let contract: SampleRedstoneConsumerMockManySymbolsV2;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbolsV2"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2([
      getMockPackage({
        mockSignerIndex: 0,
        dataPoints: [
          { symbol: "BTC", value: 412 },
          { symbol: "ETH", value: 41 },
        ],
      }),
      getMockPackage({
        mockSignerIndex: 1,
        dataPoints: [
          { symbol: "BTC", value: 390 },
          { symbol: "ETH", value: 42 },
        ],
      }),
      getMockPackage({
        mockSignerIndex: 2,
        dataPoints: [
          { symbol: "BTC", value: 400 },
          { symbol: "ETH", value: 43 },
        ],
      }),
    ]);

    const tx = await wrappedContract.saveLatestPricesInStorage();
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestEthPrice();
    const latestBtcPriceFromContract = await contract.latestBtcPrice();
    expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
    expect(latestBtcPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(400);
  });
});
