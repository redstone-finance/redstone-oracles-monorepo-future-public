import {
  DataPackage,
  SignedDataPackage,
  RedstonePayload,
} from "redstone-protocol";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export interface MockDataPackageConfig {
  signer: MockSignerAddress;
  dataPackage: DataPackage;
}

export class MockWrapper extends BaseWrapper {
  constructor(private mockDataPackages: MockDataPackageConfig[]) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#mock`;
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDataPackages) {
      const privateKey = getMockSignerPrivateKey(mockDataPackage.signer);
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages.push(signedDataPackage);
    }

    const unsignedMetadata = this.getUnsignedMetadata();

    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }
}
