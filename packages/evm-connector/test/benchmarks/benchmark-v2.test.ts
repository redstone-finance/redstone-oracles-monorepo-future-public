import { ethers } from "hardhat";
import { DataPackage, NumericDataPoint } from "redstone-protocol";
import { convertStringToBytes32 } from "redstone-protocol/dist/src/common/utils";
import {
  MOCK_SIGNERS,
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MockSignerAddress,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfigV2 } from "../../src/wrappers/MockWrapperV2";
import { BenchmarkV2 } from "../../typechain-types";

interface BenchmarkTestCaseParams {
  requiredSignersCount: number;
  requestedSymbolsCount: number;
  dataPointsCount: number;
}

// const TEST_CASES = {
//   requiredSignersCount: [1, 2, 10, 20],
//   requestedSymbolsCount: [1, 2, 10, 20, 30],
//   dataPointsCount: [1, 2, 10, 20, 200],
// };

const TEST_CASES = {
  requiredSignersCount: [1, 2],
  requestedSymbolsCount: [1, 2],
  dataPointsCount: [1, 2, 200],
};

describe("BenchmarkV2", function () {
  let contract: BenchmarkV2;
  const fullGasReport = {};

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("BenchmarkV2");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  this.afterAll(async () => {
    console.log("TODO - print final gas report");
    console.log(fullGasReport);
  });

  const prepareMockDataPackageConfig = (
    benchmarkParams: BenchmarkTestCaseParams
  ): MockDataPackageConfigV2[] => {
    // Prepare data package
    const dataPoints = [...Array(benchmarkParams.dataPointsCount).keys()].map(
      (i) =>
        new NumericDataPoint({
          symbol: `TEST-${i}`,
          value: 42 + i,
        })
    );
    const mockDataPackages: MockDataPackageConfigV2[] = [
      ...Array(benchmarkParams.requiredSignersCount).keys(),
    ].map((i) => ({
      dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
      signer: MOCK_SIGNERS[i].address as MockSignerAddress,
    }));

    return mockDataPackages;
  };

  // const updateFullGasReport = (benchmarkParams: BenchmarkTestCaseParams, gasReport)

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    console.log(`Benchmark case testing started`);
    console.log(benchmarkParams);

    const symbols = [...Array(10).keys()].map((i) => `TEST-${i}`);
    const bytes32Symbols = symbols.map(convertStringToBytes32);
    const mockDataPackagesConfig =
      prepareMockDataPackageConfig(benchmarkParams);
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockDataV2(
      mockDataPackagesConfig
    );

    // Updating unique signers count in contract
    const uniqueSignersThresholdUpdateTx =
      await contract.updateUniqueSignersThreshold(
        benchmarkParams.requiredSignersCount
      );
    await uniqueSignersThresholdUpdateTx.wait();

    // Test empty function without wrapping
    const emptyTxWithoutWrapping = await contract.emptySaveLatestValueInStorage(
      bytes32Symbols
    );
    const emptyTxWithoutWrappingReceipt = await emptyTxWithoutWrapping.wait();

    // Test empty function with wrapping
    const emptyTxWithWrapping =
      await wrappedContract.emptySaveLatestValueInStorage(bytes32Symbols);
    const emptyTxWithWrappingReceipt = await emptyTxWithWrapping.wait();

    // Test non-empty function with wrapping
    const realOracleTx = await wrappedContract.saveLatestValueInStorage(
      bytes32Symbols
    );
    await realOracleTx.wait();

    const gasCost = {
      forAttachingDataToCalldata: emptyTxWithWrappingReceipt.gasUsed
        .sub(emptyTxWithoutWrappingReceipt)
        .toNumber(),
      forDataExtractionAndVerification: realOracleTx.gasUsed
        .sub(emptyTxWithWrapping.gasUsed)
        .toNumber(),
    };

    console.log({ gasCost });

    // TODO: Save in fullGasReport
    // updateFull..
  };

  for (const requiredSignersCount of TEST_CASES.requiredSignersCount) {
    for (const requestedSymbolsCount of TEST_CASES.requestedSymbolsCount) {
      for (const dataPointsCount of TEST_CASES.dataPointsCount) {
        const benchmarkParams: BenchmarkTestCaseParams = {
          requiredSignersCount,
          requestedSymbolsCount,
          dataPointsCount,
        };
        it(`Benchmark: ${JSON.stringify(benchmarkParams)}`, async () => {
          await runBenchmarkTestCase(benchmarkParams);
        });
      }
    }
  }
});
