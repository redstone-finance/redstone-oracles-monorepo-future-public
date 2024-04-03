import { ScoreType } from "@redstone-finance/protocol";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Contract } from "ethers";
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

export class WrapperBuilder<T extends Contract> {
  constructor(private baseContract: T) {}

  static wrap<T extends Contract>(contract: T): WrapperBuilder<T> {
    return new WrapperBuilder(contract);
  }

  usingDataService(dataPackagesRequestInput: DataPackagesRequestInput): T {
    return new DataServiceWrapper<T>(
      dataPackagesRequestInput
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockDataPackages(mockDataPackages: MockDataPackageConfig[]): T {
    return new MockWrapper<T>(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }

  usingSimpleNumericMock(simpleNumericMockConfig: SimpleNumericMockConfig): T {
    return new SimpleNumericMockWrapper<T>(
      simpleNumericMockConfig
    ).overwriteEthersContract(this.baseContract);
  }

  usingOnDemandRequest(nodeUrls: string[], scoreType: ScoreType): T {
    return new OnDemandRequestWrapper<T>(
      {
        signer: this.baseContract.signer,
        scoreType,
      },
      nodeUrls
    ).overwriteEthersContract(this.baseContract);
  }

  usingDataPackages(dataPackages: DataPackagesResponse) {
    return new DataPackagesWrapper<T>(dataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
