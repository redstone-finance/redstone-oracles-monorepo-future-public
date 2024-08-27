/* eslint-disable @typescript-eslint/unbound-method */
import {
  DataPackage,
  NumericDataPoint,
  utils,
} from "@redstone-finance/protocol";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MOCK_SIGNERS,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfig } from "../src/wrappers/MockWrapper";
import { HashCalldataModel, StorageStructureModel } from "../typechain-types";

interface BenchmarkTestCaseParams {
  passedArgumentsCount: number;
  deleteFromStorage: {
    struct: boolean;
    hash: boolean;
  };
}

interface GasReport {
  forSavingRequestAsStruct: number | string;
  forSavingRequestAsHash: number | string;
  forExecutingRequestAsStruct: number | string;
  forExecutingRequestAsHash: number | string;
}

const TEST_CASES = {
  passedArgumentsCount: [3, 5, 10],
  deleteFromStorage: [
    { struct: false, hash: false },
    { struct: false, hash: true },
    { struct: true, hash: true },
  ],
};

const requiredSignersCount = 3;

describe("Benchmark", function () {
  let storageStructureModel: StorageStructureModel;
  let hashCalldataModel: HashCalldataModel;
  const fullGasReport: Record<string, GasReport> = {};

  this.beforeEach(async () => {
    const StorageStructureFactory = await ethers.getContractFactory(
      "StorageStructureModel"
    );

    const HashCalldataFactory =
      await ethers.getContractFactory("HashCalldataModel");

    storageStructureModel = await StorageStructureFactory.deploy();
    await storageStructureModel.deployed();

    hashCalldataModel = await HashCalldataFactory.deploy();
    await hashCalldataModel.deployed();
  });

  this.afterAll(() => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(JSON.stringify(fullGasReport, null, 2));
  });

  const prepareMockDataPackageConfig = (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    // Prepare many data packages (for each requested symbol there are many data packages with each signer)
    const mockDataPackages: MockDataPackageConfig[] = [];
    for (
      let requestedSymbolIndex = 0;
      requestedSymbolIndex < benchmarkParams.passedArgumentsCount;
      requestedSymbolIndex++
    ) {
      for (
        let signerIndex = 0;
        signerIndex < requiredSignersCount;
        signerIndex++
      ) {
        const dataPoints = [
          new NumericDataPoint({
            dataFeedId: `TEST-${requestedSymbolIndex}`,
            value: 42 + requestedSymbolIndex,
          }),
        ];
        mockDataPackages.push({
          dataPackage: new DataPackage(
            dataPoints,
            DEFAULT_TIMESTAMP_FOR_TESTS,
            "__TEST__"
          ),
          signer: MOCK_SIGNERS[signerIndex].address as MockSignerAddress,
        });
      }
    }

    return mockDataPackages;
  };

  const updateFullGasReport = (
    benchmarkParams: BenchmarkTestCaseParams,
    gasReport: GasReport
  ) => {
    const benchmarkCaseKey = getBenchmarkCaseShortTitle(benchmarkParams);
    fullGasReport[benchmarkCaseKey] = gasReport;
  };

  const getBenchmarkCaseShortTitle = (
    benchmarkParams: BenchmarkTestCaseParams
  ): string => {
    return (
      benchmarkParams.passedArgumentsCount +
      " arguments, " +
      benchmarkParams.deleteFromStorage.struct +
      " delete struct, " +
      benchmarkParams.deleteFromStorage.hash +
      " delete hash"
    );
  };

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    const shortTitle = getBenchmarkCaseShortTitle(benchmarkParams);

    console.log(`Benchmark case testing started: ${shortTitle}`);

    const dataFeedIds = [
      ...Array(benchmarkParams.passedArgumentsCount).keys(),
    ].map((i) => `TEST-${i}`);

    const bytes32Symbols = dataFeedIds.map(utils.convertStringToBytes32);
    const mockDataPackagesConfig =
      prepareMockDataPackageConfig(benchmarkParams);

    const wrappedStorageStructureModel = WrapperBuilder.wrap(
      storageStructureModel
    ).usingMockDataPackages(mockDataPackagesConfig);
    const wrappedHashCalldataModel = WrapperBuilder.wrap(
      hashCalldataModel
    ).usingMockDataPackages(mockDataPackagesConfig);

    const setDeleteFromStorageStructTx =
      await wrappedStorageStructureModel.setDeleteFromStorage(
        benchmarkParams.deleteFromStorage.struct
      );
    await setDeleteFromStorageStructTx.wait();

    const setDeleteFromStorageHashTx =
      await wrappedHashCalldataModel.setDeleteFromStorage(
        benchmarkParams.deleteFromStorage.hash
      );
    await setDeleteFromStorageHashTx.wait();

    try {
      let sendStructRequestFunction: (
        ...args: Uint8Array[]
      ) => Promise<ContractTransaction>;
      let executeStructRequestFunction: (
        requestId: number
      ) => Promise<ContractTransaction>;
      let sendHashRequestFunction: (
        ...args: Uint8Array[]
      ) => Promise<ContractTransaction>;
      let executeHashRequestFunction: (
        blockNumber: number,
        address: string,
        ...args: Uint8Array[]
      ) => Promise<ContractTransaction>;

      switch (benchmarkParams.passedArgumentsCount) {
        case 3:
          sendStructRequestFunction =
            wrappedStorageStructureModel.sendRequestWith3Args as typeof sendStructRequestFunction;
          executeStructRequestFunction =
            wrappedStorageStructureModel.executeRequestWith3ArgsWithPrices;
          sendHashRequestFunction =
            wrappedHashCalldataModel.sendRequestWith3Args as typeof sendHashRequestFunction;
          executeHashRequestFunction =
            wrappedHashCalldataModel.executeRequestWith3ArgsWithPrices as typeof executeHashRequestFunction;
          break;
        case 5:
          sendStructRequestFunction =
            wrappedStorageStructureModel.sendRequestWith5Args as typeof sendStructRequestFunction;
          executeStructRequestFunction =
            wrappedStorageStructureModel.executeRequestWith5ArgsWithPrices;
          sendHashRequestFunction =
            wrappedHashCalldataModel.sendRequestWith5Args as typeof sendHashRequestFunction;
          executeHashRequestFunction =
            wrappedHashCalldataModel.executeRequestWith5ArgsWithPrices as typeof executeHashRequestFunction;
          break;
        /** too many arguments - does not compile without optimizer enabled
        case 10:
          sendStructRequestFunction =
            wrappedStorageStructureModel.sendRequestWith10Args as typeof sendStructRequestFunction;
          executeStructRequestFunction =
            wrappedStorageStructureModel.executeRequestWith10ArgsWithPrices;
          sendHashRequestFunction =
            wrappedHashCalldataModel.sendRequestWith10Args as typeof sendHashRequestFunction;
          executeHashRequestFunction =
            wrappedHashCalldataModel.executeRequestWith10ArgsWithPrices as typeof executeHashRequestFunction;
          break;
          */
        default:
          throw new Error("Unsupported passed arguments count");
      }
      const requestStructTx = await sendStructRequestFunction(
        ...bytes32Symbols
      );
      const requestStructTxReceipt = await requestStructTx.wait();

      const executeRequestStructTx = await executeStructRequestFunction(1);
      const executeRequestStructTxReceipt = await executeRequestStructTx.wait();

      const requestHashTx = await sendHashRequestFunction(...bytes32Symbols);
      const requestHashTxReceipt = await requestHashTx.wait();

      const blockNumber = await ethers.provider.getBlockNumber();
      const sender = await ethers.provider.getSigner(0).getAddress();
      const executeRequestHashTx = await executeHashRequestFunction(
        blockNumber,
        sender,
        ...bytes32Symbols
      );
      const executeRequestHashTxReceipt = await executeRequestHashTx.wait();

      const gasReport: GasReport = {
        forSavingRequestAsStruct: requestStructTxReceipt.gasUsed.toNumber(),
        forSavingRequestAsHash: requestHashTxReceipt.gasUsed.toNumber(),
        forExecutingRequestAsStruct:
          executeRequestStructTxReceipt.gasUsed.toNumber(),
        forExecutingRequestAsHash:
          executeRequestHashTxReceipt.gasUsed.toNumber(),
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        forSavingRequestAsStruct: "error-too-much-gas",
        forSavingRequestAsHash: "error-too-much-gas",
        forExecutingRequestAsStruct: "error-too-much-gas",
        forExecutingRequestAsHash: "error-too-much-gas",
      });
    }
  };

  for (const deleteFromStorage of TEST_CASES.deleteFromStorage) {
    for (const passedArgumentsCount of TEST_CASES.passedArgumentsCount) {
      const benchmarkParams: BenchmarkTestCaseParams = {
        passedArgumentsCount,
        deleteFromStorage,
      };
      it(`Benchmark: ${getBenchmarkCaseShortTitle(
        benchmarkParams
      )}`, async () => {
        await runBenchmarkTestCase(benchmarkParams);
      });
    }
  }
});
