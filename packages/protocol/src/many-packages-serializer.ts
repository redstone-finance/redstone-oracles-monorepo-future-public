import { arrayify, concat } from "ethers/lib/utils";
import {
  NUMBER_OF_DATA_PACKAGES_BS,
  NUMBER_OF_SIGNATURES_BS,
} from "./common/redstone-consts";
import {
  convertIntegerNumberToBytes,
  hexlifyWithout0xPrefix,
} from "./common/utils";
import { DataPackageBase } from "./data-package/DataPackageBase";
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
      NUMBER_OF_DATA_PACKAGES_BS
    ),
  ]);
};

export const serializeSignedDataPackages = (
  signedDataPackages: SignedDataPackage[]
): string => {
  const seializedBytes = serializeSignedDataPackagesToBytes(signedDataPackages);
  return hexlifyWithout0xPrefix(seializedBytes);
};

export const serializeUnsignedDataPackageWithManySignaturesToBytes = (
  dataPackage: DataPackageBase,
  signatures: string[]
): Uint8Array => {
  return concat([
    dataPackage.serializeToBytes(),
    ...signatures.map((signature) => arrayify(signature)),
    convertIntegerNumberToBytes(signatures.length, NUMBER_OF_SIGNATURES_BS),
  ]);
};

export const serializeUnsignedDataPackageWithManySignatures = (
  dataPackage: DataPackageBase,
  signatures: string[]
): string => {
  const seializedBytes = serializeUnsignedDataPackageWithManySignaturesToBytes(
    dataPackage,
    signatures
  );
  return hexlifyWithout0xPrefix(seializedBytes);
};
