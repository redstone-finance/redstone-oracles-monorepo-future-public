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

  // This function is async, because it's async in BaseWrapper
  async getDataPackagesForPayload() {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDataPackages) {
      const privateKey = getMockSignerPrivateKey(mockDataPackage.signer);
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages.push(signedDataPackage);
    }

    return signedDataPackages;
  }

  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }
}
