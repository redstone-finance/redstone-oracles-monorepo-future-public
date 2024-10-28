import { Signature } from "ethers";
import {
  arrayify,
  base64,
  computeAddress,
  joinSignature,
  splitSignature,
} from "ethers/lib/utils";
import { ecdsaRecover } from "secp256k1";
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

const RS_SIGNATURE_LENGTH = 64;

export function recoverSignerPublicKey(
  object: SignedDataPackageLike
): Uint8Array {
  const digest = object.dataPackage.getSignableHash();
  const joinedSignature = arrayify(joinSignature(object.signature));

  if (joinedSignature.length !== RS_SIGNATURE_LENGTH + 1) {
    throw new Error(
      `Wrong signature length: ${joinedSignature.length} instead of ${RS_SIGNATURE_LENGTH + 1}`
    );
  }

  const publicKeyHex = ecdsaRecover(
    joinedSignature.slice(0, RS_SIGNATURE_LENGTH),
    object.signature.recoveryParam,
    digest,
    false
  );

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
