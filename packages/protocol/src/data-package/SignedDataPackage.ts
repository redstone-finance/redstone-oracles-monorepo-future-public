import { Signature } from "ethers";
import {
  arrayify,
  computeAddress,
  concat,
  joinSignature,
  recoverPublicKey,
  splitSignature,
} from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { DataPackage } from "./DataPackage";

export class SignedDataPackage extends Serializable {
  public readonly signature: Signature;

  constructor(
    public readonly dataPackage: DataPackage,
    signature: Signature | string
  ) {
    super();
    if (typeof signature === "string") {
      this.signature = splitSignature(signature);
    } else {
      this.signature = signature;
    }
  }

  serializeSignatureToBytes(): Uint8Array {
    return arrayify(this.serializeSignatureToHex());
  }

  serializeSignatureToHex(): string {
    return joinSignature(this.signature);
  }

  recoverSignerPublicKey(): Uint8Array {
    const digest = this.dataPackage.getSignableHash();
    const publicKeyHex = recoverPublicKey(digest, this.signature);
    return arrayify(publicKeyHex);
  }

  recoverSignerAddress(): string {
    const signerPublicKeyBytes = this.recoverSignerPublicKey();
    return computeAddress(signerPublicKeyBytes);
  }

  serializeToBytes(): Uint8Array {
    return concat([
      this.dataPackage.serializeToBytes(),
      this.serializeSignatureToBytes(),
    ]);
  }
}
