import { Contract } from "ethers";
import { DataPackage } from "redstone-protocol";
import { MockWrapper } from "./wrappers/MockWrapper";

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

  usingMockData(mockDataPackage: DataPackage) {
    return new MockWrapper(mockDataPackage).overwriteEthersContract(
      this.baseContract
    );
  }
}
