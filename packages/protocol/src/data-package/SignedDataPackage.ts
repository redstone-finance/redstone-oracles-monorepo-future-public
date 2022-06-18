import { Signature } from "ethers";
import { arrayify, concat, joinSignature } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { DataPackageBase } from "./DataPackageBase";

export class SignedDataPackage extends Serializable {
  constructor(
    public readonly dataPackage: DataPackageBase,
    public readonly signature: Signature
  ) {
    super();
  }

  protected serializeSignature(): Uint8Array {
    return arrayify(joinSignature(this.signature));
  }

  serializeToBytes(): Uint8Array {
    return concat([
      this.dataPackage.serializeToBytes(),
      this.serializeSignature(),
    ]);
  }
}
