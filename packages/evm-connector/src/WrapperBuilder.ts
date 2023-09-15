import { Contract } from "ethers";
import { ScoreType } from "@redstone-finance/protocol";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { DataPackagesWrapper } from "./wrappers/DataPackagesWrapper";
import {
  DataPackagesRequestInput,
  DataServiceWrapper,
} from "./wrappers/DataServiceWrapper";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { OnDemandRequestWrapper } from "./wrappers/OnDemandRequestWrapper";
import {
  SimpleNumericMockConfig,
  SimpleNumericMockWrapper,
} from "./wrappers/SimpleMockNumericWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataService(
    dataPackagesRequestInput: DataPackagesRequestInput
  ): Contract {
    return new DataServiceWrapper(
      dataPackagesRequestInput
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

  usingDataPackages(dataPackages: DataPackagesResponse) {
    return new DataPackagesWrapper(dataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
