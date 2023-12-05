import { beginCell, Cell, serializeTuple } from "@ton/core";
import { createTupleItems } from "../ton-utils";
import { TonInitData } from "../TonInitData";
import { consts } from "@redstone-finance/protocol";
import { SIGNER_COUNT_THRESHOLD_BITS } from "../config/constants";

export class PriceManagerInitData implements TonInitData {
  constructor(
    private signerCountThreshold: number,
    private signers: string[]
  ) {}

  toCell(): Cell {
    return beginCell()
      .storeUint(this.signerCountThreshold, SIGNER_COUNT_THRESHOLD_BITS)
      .storeUint(0, consts.TIMESTAMP_BS * 8)
      .storeRef(serializeTuple(createTupleItems(this.signers)))
      .endCell();
  }
}
