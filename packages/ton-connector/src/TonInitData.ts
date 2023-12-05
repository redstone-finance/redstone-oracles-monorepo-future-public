import { beginCell, Cell } from "@ton/core";

export class TonInitData {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- To be overridden when needed
  toCell(): Cell {
    return beginCell().endCell();
  }
}
