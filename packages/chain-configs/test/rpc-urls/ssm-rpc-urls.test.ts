import { readSsmRpcUrls } from "../../scripts/read-ssm-rpc-urls";
import { validateRpcUrls } from "./common";

const validateSsmMainRpcUrls = async () => {
  const rpcUrlsPerChain = await readSsmRpcUrls(false);
  validateRpcUrls(rpcUrlsPerChain);
};

describe("SSM Main Rpc Urls Validation", function () {
  before(async function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    await validateSsmMainRpcUrls();
  });

  it("force before hook to get executed", () => {});
});

const validateSsmFallbackRpcUrls = async () => {
  const rpcUrlsPerChain = await readSsmRpcUrls(true);

  validateRpcUrls(rpcUrlsPerChain);
};

describe("SSM Fallback Rpc Urls Validation", function () {
  before(async function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    await validateSsmFallbackRpcUrls();
  });

  it("force before hook to get executed", () => {});
});
