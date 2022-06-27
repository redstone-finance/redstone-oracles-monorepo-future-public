import { hexlify } from "@ethersproject/bytes";
import {
  DataPackageBase,
  serializeSignedDataPackages,
  SignedDataPackage,
} from "redstone-protocol";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export interface MockDataPackageConfigV2 {
  signer: MockSignerAddress;
  dataPackage: DataPackageBase;
}

export class MockWrapperV2 extends BaseWrapper {
  constructor(private mockDataPackages: MockDataPackageConfigV2[]) {
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
