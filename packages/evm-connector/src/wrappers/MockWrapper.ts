import {
  DataPackage,
  serializeSignedDataPackageToHexString,
  signDataPackage,
} from "redstone-protocol";
import { MOCK_PRIVATE_KEYS } from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";

export class MockWrapper extends BaseWrapper {
  constructor(private mockDataPackage: DataPackage) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackage = await signDataPackage(
      this.mockDataPackage,
      MOCK_PRIVATE_KEYS[0]
    );
    return serializeSignedDataPackageToHexString(signedDataPackage);
  }
}
