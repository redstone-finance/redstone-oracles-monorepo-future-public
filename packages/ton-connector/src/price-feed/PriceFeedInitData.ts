import { Address, beginCell, Cell } from "ton-core";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { TonInitData } from "../TonInitData";
import { consts } from "@redstone-finance/protocol";

export class PriceFeedInitData implements TonInitData {
  constructor(
    private feed_id: string,
    private manager_address: string
  ) {}

  toCell(): Cell {
    return beginCell()
      .storeUint(
        BigInt(hexlify(toUtf8Bytes(this.feed_id))),
        consts.DATA_FEED_ID_BS * 8
      )
      .storeAddress(Address.parse(this.manager_address))
      .storeUint(0, consts.DEFAULT_NUM_VALUE_BS * 8)
      .storeUint(0, consts.TIMESTAMP_BS * 8)
      .endCell();
  }
}
