import {
  isBytesLike,
  SignatureLike,
  splitSignature,
} from "@ethersproject/bytes";
import { Signer, Wallet } from "ethers";
import {
  arrayify,
  computeAddress,
  hexlify,
  joinSignature,
  keccak256,
  SigningKey,
  toUtf8Bytes,
  verifyMessage,
} from "ethers/lib/utils";
import { ecdsaRecover } from "secp256k1";

const RS_SIGNATURE_LENGTH = 64;
const ECDSA_N_DIV_2 = BigInt(
  "0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0"
);

export class UniversalSigner {
  // A flag allowing to disable the signature verification globally for all checks
  public static isSignatureVerificationSkipped = false;

  static getDigestForData(data: unknown) {
    const message = JSON.stringify(data);

    return keccak256(toUtf8Bytes(message));
  }

  static signStringifiableData(data: unknown, privateKey: string): string {
    const digest = UniversalSigner.getDigestForData(data);
    const signingKey = new SigningKey(privateKey);
    const fullSignature = signingKey.signDigest(digest);

    return joinSignature(fullSignature);
  }

  static recoverSigner(data: unknown, signature: SignatureLike) {
    const digest = arrayify(UniversalSigner.getDigestForData(data));
    const publicKey = UniversalSigner.recoverPublicKey(digest, signature);

    return computeAddress(publicKey);
  }

  static recoverPublicKey(digest: Uint8Array, signature: SignatureLike) {
    const sig = this.verifyAndSplitSignature(signature);

    return ecdsaRecover(
      arrayify(sig.r + sig.s.substring(2)),
      sig.recoveryParam,
      digest,
      false
    );
  }

  static verifyAndSplitSignature(signature: SignatureLike) {
    if (UniversalSigner.isSignatureVerificationSkipped) {
      return splitSignature(signature);
    }

    let v;

    if (isBytesLike(signature)) {
      const signatureString = hexlify(signature).substring(2);
      v = parseInt(signatureString.substring(2 * RS_SIGNATURE_LENGTH), 16);
    } else {
      v = (signature as { v: number }).v;
    }

    // We need to check it here, because splitSignature normalizes v to 27/28
    if (v !== 27 && v !== 28) {
      throw new Error(
        `Invalid signature 'v' value - must be 27 or 28 but is: ${v}`
      );
    }

    const sig = splitSignature(signature);

    if (BigInt(sig.s) > ECDSA_N_DIV_2) {
      throw new Error("Invalid signature 's' value");
    }

    return sig;
  }

  static signWithEthereumHashMessage(
    signerOrWallet: Signer | Wallet,
    message: string
  ): Promise<string> {
    return signerOrWallet.signMessage(message);
  }

  static recoverAddressFromEthereumHashMessage(
    message: string,
    signature: string
  ): string {
    this.verifyAndSplitSignature(signature);

    return verifyMessage(message, signature);
  }
}
