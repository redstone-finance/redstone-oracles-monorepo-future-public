import {
  DataPackage,
  serializeSignedDataPackageToHexString,
  signDataPackage,
} from "redstone-protocol";
import { BaseWrapper } from "./BaseWrapper";

// Well-known private key for address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export class MockWrapper extends BaseWrapper {
  constructor(private mockDataPackage: DataPackage) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackage = await signDataPackage(
      this.mockDataPackage,
      MOCK_PRIVATE_KEY
    );
    return serializeSignedDataPackageToHexString(signedDataPackage);
  }
}
