import { RedstoneCommon } from "@redstone-finance/utils";
import { CasperConfig } from "../../src";
import "dotenv/config";
import { z } from "zod";

const NODE_URL = "http://52.35.59.254:7777";
const STATUS_API = "http://52.35.59.254:8888/status";
const NETWORK_NAME = "casper-test";

export const config = Object.freeze(<CasperConfig>{
  keysPath: RedstoneCommon.getFromEnv("CASPER_KEYS_PATH", z.string()),
  nodeUrl: NODE_URL,
  statusApi: STATUS_API,
  networkName: NETWORK_NAME,
});
