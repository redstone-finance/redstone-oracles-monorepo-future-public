import { Contract } from "ethers";
import { old } from "redstone-protocol";
import { MockDynamicDataPackageConfigV2 } from "./wrappers/MockDynamicWrapperV2";
import { MockWrapper } from "./wrappers/MockWrapper";
import {
  MockDataPackageConfigV2,
  MockWrapperV2,
} from "./wrappers/MockWrapperV2";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  // TODO: implement
  usingDataFeed(dataFeedId: string): Contract {
    return this.baseContract;
  }

  // TODO: implement
  usingDataSources(dataSourcesConfig: any[]): Contract {
    return this.baseContract;
  }

  usingMockData(mockDataPackage: old.DataPackage) {
    return new MockWrapper(mockDataPackage).overwriteEthersContract(
      this.baseContract
    );
  }

  usingMockDataV2(mockDataPackages: MockDataPackageConfigV2[]) {
    return new MockWrapperV2(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }

  usingMockDynamicDataV2(mockDataPackages: MockDynamicDataPackageConfigV2[]) {
    return new MockWrapperV2(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
