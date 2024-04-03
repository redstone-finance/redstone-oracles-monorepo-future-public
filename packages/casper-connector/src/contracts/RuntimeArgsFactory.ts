import { CLValue, CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { encodeByteCLList, encodeCLU256 } from "../casper/utils";
import {
  ARG_NAME_CHUNK_INDEX,
  ARG_NAME_FEED_IDS,
  ARG_NAME_HASH,
  ARG_NAME_PAYLOAD,
} from "./constants";

export class RuntimeArgsFactory {
  public static CHUNK_SIZE_BYTES = 875;

  public static makePayloadRuntimeArgs(feedIds: string[], payloadHex: string) {
    const args = new Map<string, CLValue>();
    args.set(ARG_NAME_FEED_IDS, CLValueBuilder.list(feedIds.map(encodeCLU256)));
    args.set(ARG_NAME_PAYLOAD, encodeByteCLList(payloadHex));

    return new RuntimeArgs(args);
  }

  public static makeChunkRuntimeArgsList(
    feedIds: string[],
    payloadHex: string,
    hash: string
  ): RuntimeArgs[] {
    const chunkSize = RuntimeArgsFactory.CHUNK_SIZE_BYTES * 2;
    const numberOfChunks = Math.floor(
      (payloadHex.length + chunkSize - 1) / chunkSize
    );

    const result: RuntimeArgs[] = [];

    for (let chunkIndex = 0; chunkIndex < numberOfChunks; chunkIndex++) {
      const chunk = payloadHex.substring(
        chunkIndex * chunkSize,
        (chunkIndex + 1) * chunkSize
      );

      const args = RuntimeArgsFactory.makeProcessChunkRuntimeArgs(
        feedIds,
        chunk,
        hash,
        chunkIndex
      );

      result.push(args);
    }

    return result;
  }

  private static makeProcessChunkRuntimeArgs(
    feedIds: string[],
    chunk: string,
    hash: string,
    index: number
  ) {
    const args = RuntimeArgsFactory.makePayloadRuntimeArgs(
      feedIds,
      `0x${chunk}`
    );

    args.insert(ARG_NAME_HASH, encodeByteCLList(hash));
    args.insert(ARG_NAME_CHUNK_INDEX, CLValueBuilder.u8(index));

    return args;
  }
}
