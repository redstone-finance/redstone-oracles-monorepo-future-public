import * as pako from "pako";
import { StreamrClient } from "streamr-client";

export { StreamrClient, Subscription, StreamPermission } from "streamr-client";

export const getStreamIdForNodeByEvmAddress = (evmAddress: string) =>
  `${evmAddress}/redstone-oracle-node/data-packages`;

export const doesStreamExist = async (
  streamr: StreamrClient,
  streamId: string
): Promise<boolean> => {
  try {
    await streamr.getStream(streamId);
    return true;
  } catch (error) {
    if ((error as Error).toString().includes("NOT_FOUND")) {
      return false;
    } else {
      throw error;
    }
  }
};

export const compressMsg = (data: unknown) => {
  const dataStringified = JSON.stringify(data);
  return pako.deflate(dataStringified);
};

export const decompressMsg = <T = unknown>(msg: Uint8Array): T => {
  const stringifiedData = pako.inflate(msg, {
    to: "string",
  });
  return JSON.parse(stringifiedData) as T;
};
