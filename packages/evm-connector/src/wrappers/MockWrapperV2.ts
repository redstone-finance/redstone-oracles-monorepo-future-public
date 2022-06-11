import {
  DataPackage,
  serializeSignedDataPackagesToHexString,
  signDataPackage,
  SignedDataPackage,
} from "redstone-protocol";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export interface MockDataPackageConfigV2 {
  signer: MockSignerAddress;
  dataPackage: DataPackage;
}

export class MockWrapperV2 extends BaseWrapper {
  constructor(private mockDataPackages: MockDataPackageConfigV2[]) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDataPackages) {
      const signedDataPackage = await signDataPackage(
        mockDataPackage.dataPackage,
        getMockSignerPrivateKey(mockDataPackage.signer)
      );
      signedDataPackages.push(signedDataPackage);
    }

    return serializeSignedDataPackagesToHexString(signedDataPackages);
  }
}
