import { Contract } from "ethers";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { DataPackagesRequestParams } from "redstone-sdk";
import { DataServiceWrapper } from "./wrappers/DataServiceWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataService(
    dataPackagesRequestParams: DataPackagesRequestParams
  ): Contract {
    return new DataServiceWrapper(
      dataPackagesRequestParams
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockData(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
