import { BlockTag } from "@ethersproject/abstract-provider";
import { convertBlockTagToNumber } from "../common";

export type CallEntry = {
  callData: string;
  target: string;
  allowFailure: boolean;
  blockTag?: BlockTag;
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
};

export class MulticallBuffer {
  constructor(private readonly maxItems: number) {}

  private _state = new Map<number, CallEntry[]>();

  push(blockTag: BlockTag | undefined, entry: CallEntry) {
    const blockId = blockTagToBlockId(blockTag);

    const bufferForBlockId = this._state.get(blockId);

    if (bufferForBlockId) {
      bufferForBlockId.push(entry);
    } else {
      this._state.set(blockId, [entry]);
    }
  }

  isFull(blockTag: BlockTag | undefined): boolean {
    const blockId = blockTagToBlockId(blockTag);
    return (
      this._state.has(blockId) &&
      this._state.get(blockId)?.length === this.maxItems
    );
  }

  isEmpty(blockTag: BlockTag | undefined): boolean {
    const blockId = blockTagToBlockId(blockTag);
    return !this._state.has(blockId);
  }

  flush(blockTag: BlockTag | undefined): CallEntry[] {
    const blockId = blockTagToBlockId(blockTag);
    const callsToFlush = this._state.get(blockId);

    if (!callsToFlush) {
      return [];
    }

    this.reset(blockId);

    return callsToFlush;
  }

  pickAll(): IterableIterator<[number, CallEntry[]]> {
    const iter = this._state.entries();
    return iter;
  }

  reset(blockId: number) {
    this._state.delete(blockId);
  }
}

function blockTagToBlockId(cand?: BlockTag): number {
  switch (cand) {
    case undefined:
    case "earliest":
    case "latest":
    case "pending":
      return -1;
    default:
      return convertBlockTagToNumber(cand);
  }
}
