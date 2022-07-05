import { concat } from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { convertStringToBytes32 } from "../common/utils";
import { ConvertableToBytes32 } from "../index-old";

export abstract class DataPoint extends Serializable {
  constructor(
    public readonly symbol: ConvertableToBytes32,
    public readonly value: Uint8Array
  ) {
    super();
  }

  serializeSymbol(): Uint8Array {
    return convertStringToBytes32(this.symbol);
  }

  getValueByteSize(): number {
    return this.value.length;
  }

  serializeToBytes(): Uint8Array {
    const serializedSymbol = this.serializeSymbol();
    return concat([serializedSymbol, this.value]);
  }
}
