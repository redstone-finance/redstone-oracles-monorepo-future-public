import {
  DataPackage,
  NumericDataPoint,
  utils,
} from "@redstone-finance/protocol";
import { ethers } from "hardhat";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MOCK_SIGNERS,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfig } from "../src/wrappers/MockWrapper";
import {
  SampleChainableStorageProxy,
  SampleChainableStorageProxyConsumer,
} from "../typechain-types";
interface BenchmarkTestCaseParams {
  requiredSignersCount: number;
  requestedSymbolsCount: number;
  dataPointsCount: number;
  proxyChainLength: number;
}

interface GasReport {
  storageProxyOneAsset: number | string;
  storageProxyOneAssetSecondWrite: number | string;
  proxyConnectorOneAsset: number | string;
  storageProxyManyAssets: number | string;
  storageProxyManyAssetsSecondWrite: number | string;
  proxyConnectorManyAssets: number | string;
}

// Change this array to configure your custom benchmark test cases
const TEST_CASES = {
  requiredSignersCount: [3, 10],
  requestedSymbolsCount: [1, 2, 10, 20],
  proxyChainLength: [2, 3, 4, 5],
};

describe("Benchmark", function () {
  const fullGasReport: Record<string, GasReport> = {};

  this.afterAll(() => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(JSON.stringify(fullGasReport, null, 2));
  });

  const initializeStorageProxyChain = async (
    chainLength: number,
    requiredSignersCount: number
  ) => {
    const StorageProxyFactory = await ethers.getContractFactory(
      "SampleChainableStorageProxy"
    );

    const StorageProxyConsumer = await ethers.getContractFactory(
      "SampleChainableStorageProxyConsumer"
    );
    const initialProxy = await StorageProxyFactory.deploy();
    await initialProxy.deployed();

    await initialProxy.updateUniqueSignersThreshold(requiredSignersCount);

    let currentProxy:
      | SampleChainableStorageProxy
      | SampleChainableStorageProxyConsumer = initialProxy;
    for (let i = 0; i < chainLength - 2; i++) {
      const nextProxy = await StorageProxyConsumer.deploy(initialProxy.address);
      await nextProxy.deployed();
      await currentProxy.register(nextProxy.address);
      currentProxy = nextProxy;
    }

    const customerContract = await StorageProxyConsumer.deploy(
      initialProxy.address
    );
    await customerContract.deployed();
    await currentProxy.register(customerContract.address);

    return initialProxy;
  };

  const initializeProxyConnectorChain = async (
    chainLength: number,
    requiredSignersCount: number
  ) => {
    const ProxyConnectorFactory = await ethers.getContractFactory(
      "SampleChainableProxyConnector"
    );

    const ProxyConnectorConsumer = await ethers.getContractFactory(
      "SampleProxyConnectorConsumer"
    );
    const initialProxy = await ProxyConnectorFactory.deploy();
    await initialProxy.deployed();

    let currentProxy = initialProxy;
    for (let i = 0; i < chainLength - 2; i++) {
      const nextProxy = await ProxyConnectorFactory.deploy();
      await nextProxy.deployed();
      await currentProxy.registerNextConnector(nextProxy.address);
      currentProxy = nextProxy;
    }

    const consumerContract = await ProxyConnectorConsumer.deploy();
    await consumerContract.deployed();
    await consumerContract.updateUniqueSignersThreshold(requiredSignersCount);

    await currentProxy.registerConsumer(consumerContract.address);

    return initialProxy;
  };

  const prepareMockDataPackageConfig = (
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
          dataPackage: new DataPackage(
            dataPoints,
            DEFAULT_TIMESTAMP_FOR_TESTS,
            `TEST-${requestedSymbolIndex}`
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
      benchmarkParams.requiredSignersCount +
      " signers, " +
      benchmarkParams.requestedSymbolsCount +
      " symbols, " +
      benchmarkParams.dataPointsCount +
      " points, " +
      benchmarkParams.proxyChainLength +
      " proxy chain length"
    );
  };

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    const shortTitle = getBenchmarkCaseShortTitle(benchmarkParams);

    console.log(`Benchmark case testing started: ${shortTitle}`);

    const dataFeedIds = [
      ...Array(benchmarkParams.requestedSymbolsCount).keys(),
    ].map((i) => `TEST-${i}`);
    const bytes32Symbols = dataFeedIds.map(utils.convertStringToBytes32);
    const mockDataPackagesConfig =
      prepareMockDataPackageConfig(benchmarkParams);

    // Initialize storage proxy chain
    const storageProxyForOneValue = await initializeStorageProxyChain(
      benchmarkParams.proxyChainLength,
      benchmarkParams.requiredSignersCount
    );
    const proxyConnectorForOneValue = await initializeProxyConnectorChain(
      benchmarkParams.proxyChainLength,
      benchmarkParams.requiredSignersCount
    );

    const storageProxyForManyValues = await initializeStorageProxyChain(
      benchmarkParams.proxyChainLength,
      benchmarkParams.requiredSignersCount
    );
    const proxyConnectorForManyValues = await initializeProxyConnectorChain(
      benchmarkParams.proxyChainLength,
      benchmarkParams.requiredSignersCount
    );

    const wrappedStorageProxyForOneValue = WrapperBuilder.wrap(
      storageProxyForOneValue
    ).usingMockDataPackages(mockDataPackagesConfig);
    const wrappedProxyConnectorForOneValue = WrapperBuilder.wrap(
      proxyConnectorForOneValue
    ).usingMockDataPackages(mockDataPackagesConfig);

    const wrappedStorageProxyForManyValues = WrapperBuilder.wrap(
      storageProxyForManyValues
    ).usingMockDataPackages(mockDataPackagesConfig);
    const wrappedProxyConnectorForManyValues = WrapperBuilder.wrap(
      proxyConnectorForManyValues
    ).usingMockDataPackages(mockDataPackagesConfig);

    // Run benchmarks
    try {
      // Get value of one asset
      const wrappedProxyConnectorOneAssetTx =
        await wrappedProxyConnectorForOneValue.processOracleValue(
          bytes32Symbols[0]
        );
      const wrappedProxyConnectorOneAssetTxReceipt =
        await wrappedProxyConnectorOneAssetTx.wait();

      const wrappedStorageProxyOneAssetTx =
        await wrappedStorageProxyForOneValue.processOracleValue(
          bytes32Symbols[0]
        );
      const wrappedStorageProxyOneAssetTxReceipt =
        await wrappedStorageProxyOneAssetTx.wait();

      // Writing value to existing storage slot should be cheaper
      const wrappedStorageProxyOneAssetSecondTx =
        await wrappedStorageProxyForOneValue.processOracleValue(
          bytes32Symbols[0]
        );
      const wrappedStorageProxyOneAssetSecondTxReceipt =
        await wrappedStorageProxyOneAssetSecondTx.wait();

      // Get value of many assets
      const wrappedProxyConnectorManyAssetsTx =
        await wrappedProxyConnectorForManyValues.processOracleValues(
          bytes32Symbols
        );
      const wrappedProxyConnectorManyAssetsTxReceipt =
        await wrappedProxyConnectorManyAssetsTx.wait();

      const wrappedStorageProxyManyAssetsTx =
        await wrappedStorageProxyForManyValues.processOracleValues(
          bytes32Symbols
        );
      const wrappedStorageProxyManyAssetsTxReceipt =
        await wrappedStorageProxyManyAssetsTx.wait();

      // Writing value to existing storage slot should be cheaper
      const wrappedStorageProxyManyAssetsSecondTx =
        await wrappedStorageProxyForManyValues.processOracleValues(
          bytes32Symbols
        );
      const wrappedStorageProxyManyAssetsSecondTxReceipt =
        await wrappedStorageProxyManyAssetsSecondTx.wait();

      const gasReport: GasReport = {
        proxyConnectorOneAsset:
          wrappedProxyConnectorOneAssetTxReceipt.gasUsed.toNumber(),
        storageProxyOneAsset:
          wrappedStorageProxyOneAssetTxReceipt.gasUsed.toNumber(),
        storageProxyOneAssetSecondWrite:
          wrappedStorageProxyOneAssetSecondTxReceipt.gasUsed.toNumber(),
        proxyConnectorManyAssets:
          wrappedProxyConnectorManyAssetsTxReceipt.gasUsed.toNumber(),
        storageProxyManyAssets:
          wrappedStorageProxyManyAssetsTxReceipt.gasUsed.toNumber(),
        storageProxyManyAssetsSecondWrite:
          wrappedStorageProxyManyAssetsSecondTxReceipt.gasUsed.toNumber(),
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        proxyConnectorOneAsset: "error-too-much-gas",
        storageProxyOneAsset: "error-too-much-gas",
        storageProxyOneAssetSecondWrite: "error-too-much-gas",
        proxyConnectorManyAssets: "error-too-much-gas",
        storageProxyManyAssets: "error-too-much-gas",
        storageProxyManyAssetsSecondWrite: "error-too-much-gas",
      });
    }
  };
  for (const proxyChainLength of TEST_CASES.proxyChainLength) {
    for (const requiredSignersCount of TEST_CASES.requiredSignersCount) {
      for (const requestedSymbolsCount of TEST_CASES.requestedSymbolsCount) {
        const dataPointsCount = 1;
        const benchmarkParams: BenchmarkTestCaseParams = {
          requiredSignersCount,
          requestedSymbolsCount,
          dataPointsCount,
          proxyChainLength,
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
