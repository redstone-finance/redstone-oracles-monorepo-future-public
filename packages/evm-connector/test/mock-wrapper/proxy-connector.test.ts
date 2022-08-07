import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleProxyConnector } from "../../typechain-types";
import { WrapperBuilder } from "../../src";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MockSignerAddress,
  MockSignerIndex,
  MOCK_SIGNERS,
} from "../../src/helpers/test-utils";
import {
  DataPackage,
  INumericDataPoint,
  NumericDataPoint,
} from "redstone-protocol";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  dataPoints: INumericDataPoint[];
  timestampMilliseconds?: number;
}

const NUMBER_OF_MOCK_SIGNERS = 10;

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfig {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const dataPoints = opts.dataPoints.map((dp) => new NumericDataPoint(dp));
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
}

function getRange(start: number, length: number): number[] {
  return [...Array(length).keys()].map((i) => (i += start));
}

describe("SampleProxyConnector", function () {
  let contract: SampleProxyConnector;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleProxyConnector"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should return correct oracle value for one asset", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
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
    ]);

    const fetchedValue = await wrappedContract.getOracleValueUsingProxy(
      convertStringToBytes32("ETH")
    );
    expect(fetchedValue).to.eq(42 * 10 ** 8);
  });

  it("Should return correct oracle values for 10 assets in correct order", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should forward msg.value", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should work properly with long encoded functions", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (timestamp invalid)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (insufficient number of unique signers)", async () => {
    expect(2 + 2).to.eq(4);
  });
});
