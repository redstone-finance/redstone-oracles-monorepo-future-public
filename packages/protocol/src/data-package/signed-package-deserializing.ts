import { Signature } from "ethers";
import {
  arrayify,
  base64,
  computeAddress,
  recoverPublicKey,
  splitSignature,
} from "ethers/lib/utils";
import { DataPackage } from "./DataPackage";
import { SignedDataPackagePlainObj } from "./SignedDataPackage";

export interface SignedDataPackageLike {
  signature: Signature;
  dataPackage: DataPackage;
}

export function deserializeSignedPackage(
  plainObject: SignedDataPackagePlainObj
): SignedDataPackageLike {
  const signatureBase64 = plainObject.signature;
  if (!signatureBase64) {
    throw new Error("Signature can not be empty");
  }
  const signatureBytes: Uint8Array = base64.decode(signatureBase64);
  const parsedSignature = splitSignature(signatureBytes);

  const { signature: _, ...unsignedDataPackagePlainObj } = plainObject;
  const unsignedDataPackage = DataPackage.fromObj(unsignedDataPackagePlainObj);

  return { signature: parsedSignature, dataPackage: unsignedDataPackage };
}

export function recoverSignerPublicKey(
  object: SignedDataPackageLike
): Uint8Array {
  const digest = object.dataPackage.getSignableHash();
  const publicKeyHex = recoverPublicKey(digest, object.signature);

  return arrayify(publicKeyHex);
}

export function recoverSignerAddress(object: SignedDataPackageLike): string {
  const signerPublicKeyBytes = recoverSignerPublicKey(object);

  return computeAddress(signerPublicKeyBytes);
}

export function recoverDeserializedSignerAddress(
  plainObj: SignedDataPackagePlainObj
): string {
  return recoverSignerAddress(deserializeSignedPackage(plainObj));
}
