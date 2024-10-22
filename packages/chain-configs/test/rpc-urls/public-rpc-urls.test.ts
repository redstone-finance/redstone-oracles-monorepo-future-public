import { RpcUrlsPerChain } from "../../scripts/read-ssm-rpc-urls";
import { getLocalChainConfigs } from "../../src";
import { validateRpcUrls } from "./common";

const CHAINS_TO_SKIP_RPC_CHECK = ["Unichain Sepolia", "Monad Devnet"];

const validatePublicRpcUrls = () => {
  const chainConfigs = getLocalChainConfigs();
  const rpcUrlsPerChain: RpcUrlsPerChain = {};

  for (const { name, chainId, publicRpcUrls } of Object.values(chainConfigs)) {
    if (name === "hardhat" || CHAINS_TO_SKIP_RPC_CHECK.includes(name)) {
      continue;
    }
    rpcUrlsPerChain[name] = {
      chainId,
      rpcUrls: publicRpcUrls,
    };
  }

  validateRpcUrls(rpcUrlsPerChain);
};

describe("Chain Configs Rpc Urls Validation", function () {
  it("public RPC URLs are valid", function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
    return validatePublicRpcUrls();
  });
});
