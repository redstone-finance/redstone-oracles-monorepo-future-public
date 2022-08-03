import { ethers } from "ethers";
import { hexlifyWithout0xPrefix } from "./utils";

export abstract class Serializable {
  abstract toBytes(): Uint8Array;
  abstract toObj(): object;

  toBytesHex(): string {
    const serializedBytes = this.toBytes();
    return ethers.utils.hexlify(serializedBytes);
  }

  toBytesHexWithout0xPrefix(): string {
    const serializedBytes = this.toBytes();
    return hexlifyWithout0xPrefix(serializedBytes);
  }

  toJSON() {
    const serializedPlainObj = this.toObj();
    return JSON.stringify(serializedPlainObj);
  }
}
