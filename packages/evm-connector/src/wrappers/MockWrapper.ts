import {
  DataPackage,
  serializeSignedDataPackages,
  SignedDataPackage,
} from "redstone-protocol";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export interface MockDataPackageConfig {
  signer: MockSignerAddress;
  dataPackage: DataPackage;
}

export class MockWrapper extends BaseWrapper {
  constructor(private mockDataPackages: MockDataPackageConfig[]) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDataPackages) {
      const privateKey = getMockSignerPrivateKey(mockDataPackage.signer);
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages.push(signedDataPackage);
    }

    return serializeSignedDataPackages(signedDataPackages);
  }
}
