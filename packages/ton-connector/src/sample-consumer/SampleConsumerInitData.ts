import { Address, beginCell, Cell } from "@ton/core";
import { TonInitData } from "../TonInitData";

export class SampleConsumerInitData implements TonInitData {
  constructor(private feedAddress: string) {}

  toCell(): Cell {
    return beginCell().storeAddress(Address.parse(this.feedAddress)).endCell();
  }
}
