import { ethers } from "ethers";

export abstract class Serializable {
  abstract toBytes(): Uint8Array;
  abstract toObj(): object;

  toBytesHex(): string {
    const serializedBytes = this.toBytes();
    return ethers.utils.hexlify(serializedBytes);
  }

  toJSON() {
    const serializedPlainObj = this.toObj();
    return JSON.stringify(serializedPlainObj);
  }
}
