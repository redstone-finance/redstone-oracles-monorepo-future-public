import { ethers } from "hardhat";
import { DataPackage, NumericDataPoint } from "redstone-protocol";
import { utils } from "redstone-protocol";
import {
  MOCK_SIGNERS,
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfig } from "../src/wrappers/MockWrapper";
import { Benchmark } from "../typechain-types";

interface BenchmarkTestCaseParams {
  requiredSignersCount: number;
  requestedSymbolsCount: number;
  dataPointsCount: number;
}

interface GasReport {
  forAttachingDataToCalldata: number | string;
  forDataExtractionAndVerification: number | string;
}

// Change this array to configure your custom benchmark test cases
const TEST_CASES = {
  requiredSignersCount: [1, 2, 10, 20, 30],
  requestedSymbolsCount: [1, 2, 10, 20, 30, 50],
  dataPointsCount: [1, 2, 10, 20, 50, 100],
};

describe("Benchmark", function () {
  let contract: Benchmark;
  const fullGasReport: any = {};

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("Benchmark");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  this.afterAll(async () => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(fullGasReport);
  });

  const prepareMockDataPackageConfig = (
    benchmarkParams: BenchmarkTestCaseParams
  ): MockDataPackageConfig[] => {
    if (
      benchmarkParams.dataPointsCount < benchmarkParams.requestedSymbolsCount
    ) {
      return prepareMockDataPackageConfigWithSingleDataPointPackages(
        benchmarkParams
      );
    } else {
      return prepareMockDataPackageConfigWithManyDataPointPackages(
        benchmarkParams
      );
    }
  };

  const prepareMockDataPackageConfigWithSingleDataPointPackages = (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    // Prepare many data packages (for each requested symbol there are many data packages with each signer)
    const mockDataPackages: MockDataPackageConfig[] = [];
    for (
      let requestedSymbolIndex = 0;
      requestedSymbolIndex < benchmarkParams.requestedSymbolsCount;
      requestedSymbolIndex++
    ) {
      for (
        let signerIndex = 0;
        signerIndex < benchmarkParams.requiredSignersCount;
        signerIndex++
      ) {
        const dataPoints = [
          new NumericDataPoint({
            dataFeedId: `TEST-${requestedSymbolIndex}`,
            value: 42 + requestedSymbolIndex,
          }),
        ];
        mockDataPackages.push({
          dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
          signer: MOCK_SIGNERS[signerIndex].address as MockSignerAddress,
        });
      }
    }

    return mockDataPackages;
  };

  const prepareMockDataPackageConfigWithManyDataPointPackages = (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    // Prepare data package for each signer (each data paackage has benchmarkParams.dataPointsCount data points)
    const dataPoints = [...Array(benchmarkParams.dataPointsCount).keys()].map(
      (i) =>
        new NumericDataPoint({
          dataFeedId: `TEST-${i}`,
          value: 42 + i,
        })
    );
    const mockDataPackages: MockDataPackageConfig[] = [
      ...Array(benchmarkParams.requiredSignersCount).keys(),
    ].map((i) => ({
      dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
      signer: MOCK_SIGNERS[i].address as MockSignerAddress,
    }));

    return mockDataPackages;
  };

  const updateFullGasReport = (
    benchmarkParams: BenchmarkTestCaseParams,
    gasReport: GasReport
  ) => {
    const becnhmarkCaseKey = getBenchmarkCaseShortTitle(benchmarkParams);
    fullGasReport[becnhmarkCaseKey] = gasReport;
  };

  const getBenchmarkCaseShortTitle = (
    benchmarkParams: BenchmarkTestCaseParams
  ): string => {
    return (
      benchmarkParams.requiredSignersCount +
      " signers, " +
      benchmarkParams.requestedSymbolsCount +
      " symbols, " +
      benchmarkParams.dataPointsCount +
      " points"
    );
  };

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    console.log(
      `Benchmark case testing started: ${getBenchmarkCaseShortTitle(
        benchmarkParams
      )}`
    );

    const dataFeedIds = [
      ...Array(benchmarkParams.requestedSymbolsCount).keys(),
    ].map((i) => `TEST-${i}`);
    const bytes32Symbols = dataFeedIds.map(utils.convertStringToBytes32);
    const mockDataPackagesConfig =
      prepareMockDataPackageConfig(benchmarkParams);
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData(
      mockDataPackagesConfig
    );

    // Updating unique signers count in contract
    const uniqueSignersThresholdUpdateTx =
      await contract.updateUniqueSignersThreshold(
        benchmarkParams.requiredSignersCount
      );
    await uniqueSignersThresholdUpdateTx.wait();

    // Test empty function without wrapping
    const emptyTxWithoutWrapping = await contract.emptyExtractOracleValues(
      bytes32Symbols
    );
    const emptyTxWithoutWrappingReceipt = await emptyTxWithoutWrapping.wait();

    // Test empty function with wrapping
    const emptyTxWithWrapping = await wrappedContract.emptyExtractOracleValues(
      bytes32Symbols
    );
    const emptyTxWithWrappingReceipt = await emptyTxWithWrapping.wait();

    try {
      // Test non-empty function with wrapping
      const realOracleTx = await wrappedContract.extractOracleValues(
        bytes32Symbols
      );
      const realOracleTxReceipt = await realOracleTx.wait();

      const gasReport: GasReport = {
        forAttachingDataToCalldata: emptyTxWithWrappingReceipt.gasUsed
          .sub(emptyTxWithoutWrappingReceipt.gasUsed)
          .toNumber(),
        forDataExtractionAndVerification: realOracleTxReceipt.gasUsed
          .sub(emptyTxWithWrappingReceipt.gasUsed)
          .toNumber(),
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        forAttachingDataToCalldata: "error-too-much-gas",
        forDataExtractionAndVerification: "error-too-much-gas",
      });
    }
  };

  for (const requiredSignersCount of TEST_CASES.requiredSignersCount) {
    for (const requestedSymbolsCount of TEST_CASES.requestedSymbolsCount) {
      for (const dataPointsCount of TEST_CASES.dataPointsCount) {
        const benchmarkParams: BenchmarkTestCaseParams = {
          requiredSignersCount,
          requestedSymbolsCount,
          dataPointsCount,
        };
        it(`Benchmark: ${getBenchmarkCaseShortTitle(
          benchmarkParams
        )}`, async () => {
          await runBenchmarkTestCase(benchmarkParams);
        });
      }
    }
  }
});
