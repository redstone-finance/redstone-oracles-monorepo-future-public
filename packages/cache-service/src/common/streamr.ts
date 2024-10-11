import { Logger } from "@nestjs/common";
import { RedstoneCommon } from "@redstone-finance/utils";
import pako from "pako";
import { StreamrClient } from "streamr-client";
import config from "../config";

export { StreamPermission, StreamrClient, Subscription } from "streamr-client";

const logger = new Logger("streamr client");

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
    logger.error(
      `failed to check if stream ${streamId} exists. ${RedstoneCommon.stringifyError(error)}`
    );
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
