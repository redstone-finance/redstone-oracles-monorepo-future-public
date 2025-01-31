import { RpcUrlsPerChain } from "../../scripts/read-ssm-rpc-urls";
import { getLocalChainConfigs } from "../../src";
import { validateNetworkRpcUrls } from "./common";

const CHAINS_TO_SKIP_RPC_CHECK = [
  "Monad Devnet",
  "Hemi Network",
  "Ink",
  "Berachain",
];

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

  validateNetworkRpcUrls(rpcUrlsPerChain);
};

describe("Public Rpc Urls Validation", function () {
  before(function () {
    if (!process.env.TEST_RPC) {
      this.skip();
    }
  });

  validatePublicRpcUrls();
});
