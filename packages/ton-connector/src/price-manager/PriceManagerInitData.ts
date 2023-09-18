import { beginCell, Cell, serializeTuple } from "ton-core";
import { createTupleItems } from "../ton-utils";
import { TonInitData } from "../TonInitData";
import { consts } from "@redstone-finance/protocol";

export class PriceManagerInitData implements TonInitData {
  constructor(
    private signer_count_threshold: number,
    private signers: string[]
  ) {}

  toCell(): Cell {
    return beginCell()
      .storeUint(this.signer_count_threshold, 8)
      .storeUint(0, consts.TIMESTAMP_BS * 8)
      .storeRef(serializeTuple(createTupleItems(this.signers)))
      .storeRef(beginCell().endCell())
      .endCell();
  }
}
