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

export interface MockDynamicDataPackageConfigV2 {
  signer: MockSignerAddress;
  // dataPackage: DynamicDataPackage;
  dataPackage: DataPackage;
}

export class MockDynamicWrapperV2 extends BaseWrapper {
  constructor(
    private mockDynamicDataPackages: MockDynamicDataPackageConfigV2[]
  ) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDynamicDataPackages) {
      const signedDataPackage = await signDataPackage(
        mockDataPackage.dataPackage,
        getMockSignerPrivateKey(mockDataPackage.signer)
      );
      signedDataPackages.push(signedDataPackage);
    }

    return serializeSignedDataPackagesToHexString(signedDataPackages);
  }
}
