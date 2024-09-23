import { readSsmRpcUrls } from "../../scripts/read-ssm-rpc-urls";
import { validateRpcUrls } from "./common";

const validateSsmRpcUrls = async () => {
  const rpcUrlsPerChain = await readSsmRpcUrls();

  validateRpcUrls(rpcUrlsPerChain);
};

describe("SSM Rpc Urls Validation", function () {
  it("Loading rpc urls from SSM", function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    return validateSsmRpcUrls();
  });
});
