import { expect } from "chai";
import { ethers } from "hardhat";
import {
  DataPackage,
  INumericDataPoint,
  NumericDataPoint,
} from "redstone-protocol";
import { convertStringToBytes32 } from "redstone-protocol/dist/src/common/utils";
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

const NUMBER_OF_MOCK_SIGNERS = 10;

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  dataPoints: INumericDataPoint[];
  timestampMilliseconds?: number;
}

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfigV2 {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const dataPoints = opts.dataPoints.map((dp) => new NumericDataPoint(dp));
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
}

// TODO: maybe move `range` function to some utils module
function getRange(start: number, length: number): number[] {
  return [...Array(length).keys()].map((i) => (i += start));
}

describe("SampleRedstoneConsumerMockManySymbolsV2", function () {
  let contract: SampleRedstoneConsumerMockManySymbolsV2;

  const mockDataConfig = [
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
    ...getRange(3, NUMBER_OF_MOCK_SIGNERS - 3).map((mockSignerIndex: any) =>
      getMockPackage({
        mockSignerIndex,
        dataPoints: [
          { symbol: "BTC", value: 400 },
          { symbol: "ETH", value: 42 },
        ],
      })
    ),
  ];

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbolsV2"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataV2(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      convertStringToBytes32("ETH"),
      convertStringToBytes32("BTC"),
    ]);
    await tx.wait();

    const ethPriceFromContract = await contract.firstValue();
    const btcPriceFromContract = await contract.secondValue();
    expect(ethPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
    expect(btcPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(400);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataV2(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      convertStringToBytes32("BTC"),
      convertStringToBytes32("ETH"),
    ]);
    await tx.wait();

    const btcPriceFromContract = await contract.firstValue();
    const ethPriceFromContract = await contract.secondValue();
    expect(btcPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(400);
    expect(ethPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  });
});
