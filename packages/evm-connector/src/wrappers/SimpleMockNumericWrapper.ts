import {
  INumericDataPoint,
  DataPackage,
  NumericDataPoint,
} from "redstone-protocol";
import {
  MAX_MOCK_SIGNERS_COUNT,
  getMockSignerAddress,
  MockSignerIndex,
  DEFAULT_TIMESTAMP_FOR_TESTS,
} from "../helpers/test-utils";
import { version } from "../../package.json";
import { MockDataPackageConfig, MockWrapper } from "./MockWrapper";

export interface SimpleNumericMockConfig {
  mockSignersCount: number;
  timestampMilliseconds?: number;
  dataPoints: INumericDataPoint[];
}

export class SimpleNumericMockWrapper extends MockWrapper {
  constructor(simpleNumericMockConfig: SimpleNumericMockConfig) {
    if (simpleNumericMockConfig.mockSignersCount > MAX_MOCK_SIGNERS_COUNT) {
      throw new Error(
        `mockSignersCount should be <= ${MAX_MOCK_SIGNERS_COUNT}`
      );
    }

    // Prepare mock data packages configs
    const mockDataPackages: MockDataPackageConfig[] = [];
    for (
      let signerIndex = 0;
      signerIndex < simpleNumericMockConfig.mockSignersCount;
      signerIndex++
    ) {
      for (const dataPointObj of simpleNumericMockConfig.dataPoints) {
        const dataPoint = new NumericDataPoint(dataPointObj);
        const timestampMilliseconds =
          simpleNumericMockConfig.timestampMilliseconds ||
          DEFAULT_TIMESTAMP_FOR_TESTS;
        const mockDataPackage: MockDataPackageConfig = {
          signer: getMockSignerAddress(signerIndex as MockSignerIndex),
          dataPackage: new DataPackage([dataPoint], timestampMilliseconds),
        };
        mockDataPackages.push(mockDataPackage);
      }
    }

    super(mockDataPackages);
  }

  getUnsignedMetadata(): string {
    return `${version}#simple-numeric-mock`;
  }
}
