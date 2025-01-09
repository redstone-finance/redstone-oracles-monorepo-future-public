import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";
import { readSsmRpcUrls } from "../../scripts/read-ssm-rpc-urls";
import {
  validateBlockNumberAgreementBetweenRpcs,
  validateNetworkRpcUrls,
} from "./common";

const chainId = RedstoneCommon.getFromEnv("CHAIN_ID", z.number().optional());
const blockNumberDiffTolerance = 5;

describe("SSM Main Rpc Urls Validation", function () {
  before(async function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    const rpcUrlsPerChain = await readSsmRpcUrls(false, chainId);
    validateNetworkRpcUrls(rpcUrlsPerChain);
    validateBlockNumberAgreementBetweenRpcs(
      rpcUrlsPerChain,
      blockNumberDiffTolerance
    );
  });
  it("force before hook to get executed", () => {});
});

describe("SSM Fallback Rpc Urls Validation", function () {
  before(async function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    const rpcUrlsPerChain = await readSsmRpcUrls(true, chainId);
    validateNetworkRpcUrls(rpcUrlsPerChain);
    validateBlockNumberAgreementBetweenRpcs(
      rpcUrlsPerChain,
      blockNumberDiffTolerance
    );
  });

  it("force before hook to get executed", () => {});
});
