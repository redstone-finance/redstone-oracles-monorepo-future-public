import {
  getChainConfigByChainId,
  getLocalChainConfigs,
} from "@redstone-finance/chain-configs";
import { MegaProviderBuilder } from "@redstone-finance/rpc-providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { expect } from "chai";
import { Bytes, Contract, ContractFunction, providers, utils } from "ethers";
import { describe, test } from "mocha";
import {
  readClassicManifests,
  readMultiFeedManifests,
} from "../../scripts/read-manifests";

const INTEGRATIONS_NOT_FOR_TESTING = [
  "unichainTestnetMultiFeed",
  "monadDevnetMultiFeed",
];

const ABI = ["function getDataFeedId() public view returns (bytes32)"];

const CONNECTION_INFO = {
  throttleLimit: 1,
  timeout: 5_000,
};

export const RETRY_CONFIG: Omit<RedstoneCommon.RetryConfig, "fn"> = {
  maxRetries: 3,
  waitBetweenMs: 1000,
};

const getProvider = (chainId: number): providers.Provider => {
  const { publicRpcUrls, name } = getChainConfigByChainId(
    getLocalChainConfigs(),
    chainId
  );
  return new MegaProviderBuilder({
    rpcUrls: publicRpcUrls,
    network: {
      chainId,
      name,
    },
    ...CONNECTION_INFO,
  })
    .agreement(
      {
        allProvidersOperationTimeout: 30_000,
        singleProviderOperationTimeout: 5_000,
        ignoreAgreementOnInsufficientResponses: true,
        minimalProvidersCount: 2,
        requireExplicitBlockTag: false,
      },
      publicRpcUrls.length !== 1
    )
    .build();
};

const checkDataFeedIdInContract = async (
  dataFeedId: string,
  address: string,
  chainId: number
) => {
  const contract = new Contract(address, ABI, getProvider(chainId));
  try {
    const dataFeedIdFromContractAsBytes = await RedstoneCommon.retry({
      fn: () => (contract.getDataFeedId as ContractFunction<Bytes>)(),
      ...RETRY_CONFIG,
    })();
    const dataFeedIdFromContract = utils.parseBytes32String(
      dataFeedIdFromContractAsBytes
    );
    if (dataFeedId === dataFeedIdFromContract) {
      return true;
    } else {
      console.log(
        `unexpected data feed id in contract: ${dataFeedIdFromContract}, expected: ${dataFeedId}`
      );
      return false;
    }
  } catch (e) {
    console.log(
      `contract.getFeedId failed with error: ${RedstoneCommon.stringifyError(e)}`
    );
    return false;
  }
};

describe("Price feed contract should return the same dataFeedId as in relayer manifest", () => {
  const classicManifests = readClassicManifests();
  for (const [name, manifest] of Object.entries(classicManifests)) {
    test(name, async () => {
      for (const [dataFeedId, priceFeedAddress] of Object.entries(
        manifest.priceFeeds
      )) {
        if (priceFeedAddress !== "__NO_FEED__") {
          expect(
            await checkDataFeedIdInContract(
              dataFeedId,
              priceFeedAddress,
              manifest.chain.id
            )
          ).to.be.true;
        }
      }
    });
  }

  const mutliFeedManifests = readMultiFeedManifests();
  for (const [name, manifest] of Object.entries(mutliFeedManifests)) {
    if (INTEGRATIONS_NOT_FOR_TESTING.includes(name)) {
      continue;
    }
    test(name, async () => {
      for (const [dataFeedId, { priceFeedAddress }] of Object.entries(
        manifest.priceFeeds
      )) {
        if (priceFeedAddress) {
          expect(
            await checkDataFeedIdInContract(
              dataFeedId,
              priceFeedAddress,
              manifest.chain.id
            )
          ).to.be.true;
        }
      }
    });
  }
});
