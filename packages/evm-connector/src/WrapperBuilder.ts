import { Contract } from "ethers";
import { DataPackagesRequestParams } from "redstone-sdk";
import { ScoreType } from "redstone-protocol";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { DataServiceWrapper } from "./wrappers/DataServiceWrapper";
import {
  SimpleNumericMockConfig,
  SimpleNumericMockWrapper,
} from "./wrappers/SimpleMockNumericWrapper";
import { OnDemandRequestWrapper } from "./wrappers/OnDemandRequestWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataService(
    dataPackagesRequestParams: DataPackagesRequestParams,
    urls: string[]
  ): Contract {
    return new DataServiceWrapper(
      dataPackagesRequestParams,
      urls
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockDataPackages(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }

  usingSimpleNumericMock(simpleNumericMockConfig: SimpleNumericMockConfig) {
    return new SimpleNumericMockWrapper(
      simpleNumericMockConfig
    ).overwriteEthersContract(this.baseContract);
  }

  usingOnDemandRequest(nodeUrls: string[], scoreType: ScoreType) {
    return new OnDemandRequestWrapper(
      {
        signer: this.baseContract.signer,
        scoreType,
      },
      nodeUrls
    ).overwriteEthersContract(this.baseContract);
  }
}
