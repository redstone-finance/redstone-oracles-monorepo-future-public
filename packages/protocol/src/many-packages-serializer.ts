import { concat } from "ethers/lib/utils";
import { DATA_PACKAGES_COUNT_BS } from "./common/redstone-consts";
import {
  convertIntegerNumberToBytes,
  hexlifyWithout0xPrefix,
} from "./common/utils";
import { SignedDataPackage } from "./data-package/SignedDataPackage";

export const serializeSignedDataPackagesToBytes = (
  signedDataPackages: SignedDataPackage[]
): Uint8Array => {
  return concat([
    ...signedDataPackages.map((signedDataPackage) =>
      signedDataPackage.serializeToBytes()
    ),
    convertIntegerNumberToBytes(
      signedDataPackages.length,
      DATA_PACKAGES_COUNT_BS
    ),
  ]);
};

export const serializeSignedDataPackages = (
  signedDataPackages: SignedDataPackage[]
): string => {
  const seializedBytes = serializeSignedDataPackagesToBytes(signedDataPackages);
  return hexlifyWithout0xPrefix(seializedBytes);
};
