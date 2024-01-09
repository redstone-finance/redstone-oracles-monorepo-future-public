import * as pako from "pako";
import { StreamrClient } from "streamr-client";
import config from "../config";

export { StreamPermission, StreamrClient, Subscription } from "streamr-client";

export const getStreamIdForNodeByEvmAddress = (evmAddress: string) =>
  config.streamrStreamNamePattern.replaceAll("{evmAddress}", evmAddress);

export const doesStreamExist = async (
  streamr: StreamrClient,
  streamId: string
): Promise<boolean> => {
  try {
    await streamr.getStream(streamId);
    return true;
  } catch (error) {
    return false;
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
