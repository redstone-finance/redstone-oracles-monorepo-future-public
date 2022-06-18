import { ethers } from "ethers";

export abstract class Serializable {
  abstract serializeToBytes(): Uint8Array;

  serializeToBytesHex() {
    const serializedBytes = this.serializeToBytes();
    return ethers.utils.hexlify(serializedBytes);
  }
}
