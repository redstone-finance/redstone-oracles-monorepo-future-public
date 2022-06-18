import { concat } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { convertStringToBytes32 } from "../common/utils";
import { ConvertableToBytes32 } from "../index-old";

export abstract class DataPointBase extends Serializable {
  constructor(
    public readonly symbol: ConvertableToBytes32,
    public readonly value: Uint8Array
  ) {
    super();
  }

  serializeSymbol(): Uint8Array {
    return convertStringToBytes32(this.symbol);
  }

  serializeToBytes(): Uint8Array {
    const serializedSymbol = this.serializeSymbol();
    return concat([serializedSymbol, this.value]);
  }
}
