import { Contract } from "ethers";
import { old as oldRedStoneProtocol } from "redstone-protocol";
import { MockWrapperOld } from "./wrappers/MockWrapperOld";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { DataPackagesRequestParams } from "redstone-sdk";
import { DataFeedWrapper } from "./wrappers/DataFeedWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataFeed(
    dataPackagesRequestParams: DataPackagesRequestParams
  ): Contract {
    return new DataFeedWrapper(
      dataPackagesRequestParams
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockDataOld(mockDataPackage: oldRedStoneProtocol.DataPackage) {
    return new MockWrapperOld(mockDataPackage).overwriteEthersContract(
      this.baseContract
    );
  }

  usingMockDataV2(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
