import { DataPackage, SignedDataPackage } from "@redstone-finance/protocol";
import { Contract } from "ethers";
import { version } from "../../package.json";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export interface MockDataPackageConfig {
  signer: MockSignerAddress;
  dataPackage: DataPackage;
}

export class MockWrapper<T extends Contract> extends BaseWrapper<T> {
  constructor(private mockDataPackages: MockDataPackageConfig[]) {
    super();
  }

  override getUnsignedMetadata(): string {
    return `${version}#mock`;
  }

  // This function is async, because it's async in BaseWrapper
  // eslint-disable-next-line @typescript-eslint/require-await
  override async getDataPackagesForPayload() {
    const signedDataPackages: SignedDataPackage[] = [];

    for (const mockDataPackage of this.mockDataPackages) {
      const privateKey = getMockSignerPrivateKey(mockDataPackage.signer);
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages.push(signedDataPackage);
    }

    return signedDataPackages;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/require-await
  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }
}
