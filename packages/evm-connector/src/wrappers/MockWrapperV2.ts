import {
  DataPackage,
  serializeSignedDataPackageToHexString,
  signDataPackage,
} from "redstone-protocol";
import { MOCK_PRIVATE_KEY } from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export class MockWrapperV2 extends BaseWrapper {
  constructor(private mockDataPackage: DataPackage) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackage = await signDataPackage(
      this.mockDataPackage,
      MOCK_PRIVATE_KEY
    );
    const serializedDataPackage =
      serializeSignedDataPackageToHexString(signedDataPackage);
    const dataPackagesCount = "0003"; // 2 bytes number
    return (
      serializedDataPackage +
      serializedDataPackage +
      serializedDataPackage +
      dataPackagesCount
    );
  }
}
