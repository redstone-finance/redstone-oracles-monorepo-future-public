import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { RedstoneCommon, RedstoneCrypto } from "@redstone-finance/utils";
import { BytesLike, providers, utils } from "ethers";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";
import { CuratedRpcList, RpcIdentifier } from "./CuratedRpcList";
import { convertBlockTagToNumber, getProviderNetworkInfo } from "../common";

const BLOCK_NUMBER_TTL = 1_000;
// 5 min (max multiblock used)
const AGREED_RESULT_TTL = 300_000;

interface ProviderWithAgreementSpecificConfig {
  numberOfProvidersThatHaveToAgree: number;
  minimalProvidersCount: number;
  getBlockNumberTimeoutMS: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
  enableRpcCuratedList: boolean;
  blockNumberTTL: number;
}

export type ProviderWithAgreementConfig = Partial<
  ProviderWithAgreementSpecificConfig & ProviderWithFallbackConfig
>;

const DEFAULT_ELECT_BLOCK_FN = (blockNumbers: number[]): number => {
  const mid = Math.floor(blockNumbers.length / 2);
  blockNumbers.sort((a, b) => a - b);

  return blockNumbers.length % 2 !== 0
    ? blockNumbers[mid]
    : Math.round((blockNumbers[mid - 1] + blockNumbers[mid]) / 2);
};

const defaultConfig: ProviderWithAgreementSpecificConfig = {
  numberOfProvidersThatHaveToAgree: 2,
  getBlockNumberTimeoutMS: 2_500,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
  enableRpcCuratedList: false,
  minimalProvidersCount: 3,
  blockNumberTTL: BLOCK_NUMBER_TTL,
};

type ProviderWithIdentifier = {
  provider: providers.Provider;
  identifier: string;
};

export class ProviderWithAgreement extends ProviderWithFallback {
  readonly agreementConfig: ProviderWithAgreementSpecificConfig;
  readonly curatedRpcList?: CuratedRpcList;
  readonly providersWithIdentifier: readonly ProviderWithIdentifier[];

  constructor(
    providers: providers.Provider[],
    config: ProviderWithAgreementConfig = {}
  ) {
    super(providers, config);
    this.agreementConfig = {
      ...defaultConfig,
      ...config,
    };
    const numberOfProvidersThatHaveToAgree =
      this.agreementConfig.numberOfProvidersThatHaveToAgree;
    if (numberOfProvidersThatHaveToAgree > this.providers.length) {
      throw new Error(
        "numberOfProvidersWhichHaveToAgree should be >= 2 and > then supplied providers count"
      );
    }
    this.providersWithIdentifier = Object.freeze(
      this.providers.map((provider, index) => ({
        provider,
        identifier: getProviderNetworkInfo(provider, {
          url: index.toString(),
          chainId: -1,
        }).url,
      }))
    );

    if (this.agreementConfig.enableRpcCuratedList) {
      this.curatedRpcList = new CuratedRpcList(
        {
          rpcIdentifiers: this.providersWithIdentifier.map((p) => p.identifier),
          minimalProvidersCount:
            config.minimalProvidersCount ??
            numberOfProvidersThatHaveToAgree + 1,
        },
        getProviderNetworkInfo(this.providers[0]).chainId
      );
    }

    this.electBlockNumber = RedstoneCommon.memoize({
      functionToMemoize: this.electBlockNumber.bind(this),
      ttl: this.agreementConfig.blockNumberTTL,
    });
  }

  getHealthyProviders(): readonly ProviderWithIdentifier[] {
    if (!this.curatedRpcList) {
      return this.providersWithIdentifier;
    }
    const choosenProviderIndentifiers = this.curatedRpcList.getBestProviders();

    return this.providersWithIdentifier.filter(({ identifier }) =>
      choosenProviderIndentifiers.includes(identifier)
    );
  }

  getChainId(): number {
    const { chainId } = getProviderNetworkInfo(this.providers[0]);
    return chainId;
  }

  updateScore(identifier: RpcIdentifier, error: boolean) {
    if (this.curatedRpcList) {
      this.curatedRpcList.scoreRpc(identifier, { error });
    }
  }

  override getBlockNumber(): Promise<number> {
    return this.electBlockNumber();
  }

  override async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ): Promise<string> {
    const electedBlockTag = utils.hexlify(
      blockTag ?? (await this.electBlockNumber())
    );

    const callResult = RedstoneCommon.timeout(
      this.executeCallWithAgreementWithCache(transaction, electedBlockTag),
      this.providerWithFallbackConfig.allProvidersOperationTimeout,
      `Agreement provider after ${this.providerWithFallbackConfig.allProvidersOperationTimeout} [ms] during call`
    );

    return await callResult;
  }

  private async electBlockNumber() {
    // collect block numbers
    const blockNumbersResults = await Promise.allSettled(
      this.getHealthyProviders().map(({ provider }) =>
        RedstoneCommon.timeout(
          provider.getBlockNumber(),
          this.agreementConfig.getBlockNumberTimeoutMS
        )
      )
    );

    const blockNumbers = blockNumbersResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<number>).value);

    if (blockNumbers.length === 0) {
      throw new AggregateError(
        blockNumbersResults.map(
          (result) =>
            new Error(String((result as PromiseRejectedResult).reason))
        ),
        `Failed to getBlockNumber from at least one provider`
      );
    }

    const electedBlockNumber = this.agreementConfig.electBlockFn(
      blockNumbers,
      this.providers.length
    );

    return electedBlockNumber;
  }

  private executeCallWithAgreementWithCache = RedstoneCommon.memoize({
    functionToMemoize: (
      transaction: Deferrable<TransactionRequest>,
      electedBlockTag: BlockTag
    ) => this.executeCallWithAgreement(transaction, electedBlockTag),
    ttl: AGREED_RESULT_TTL,
    cacheKeyBuilder: txCacheKeyBuilder,
  });

  private executeCallWithAgreement(
    transaction: Deferrable<TransactionRequest>,
    electedBlockTag: BlockTag
  ) {
    return new Promise<string>((resolve, reject) => {
      const errors: Error[] = [];
      const electedBlockNumber = convertBlockTagToNumber(electedBlockTag);
      const results = new Map<string, number>();
      let finishedProvidersCount = 0;
      let stop = false;

      const syncToElectedBlock = async ({
        provider,
        identifier,
      }: ProviderWithIdentifier) => {
        while (
          !stop &&
          (await provider.getBlockNumber()) < electedBlockNumber
        ) {
          await RedstoneCommon.sleep(500);
        }
        if (stop) {
          throw new Error(`Provider ${identifier} failed to sync to block`);
        }
      };

      const call = async ({ provider }: ProviderWithIdentifier) => {
        const currentResult = await provider.call(transaction, electedBlockTag);
        const currentResultCount = results.get(currentResult);

        if (currentResultCount) {
          results.set(currentResult, currentResultCount + 1);
          // we have found satisfying number of same responses
          if (
            currentResultCount + 1 >=
            this.agreementConfig.numberOfProvidersThatHaveToAgree
          ) {
            stop = true;
            resolve(currentResult);
          }
        } else {
          results.set(currentResult, 1);
        }
      };

      const handleProviderResult = () => {
        finishedProvidersCount++;
        if (finishedProvidersCount === this.providers.length) {
          stop = true;
          reject(
            new AggregateError(
              errors,
              `Failed to find at least ${
                this.agreementConfig.numberOfProvidersThatHaveToAgree
              } agreeing providers. ${
                this.providers.length - errors.length
              } responded with success. Result map: ${mapToString(results)}`
            )
          );
        }
      };

      const handleProviderCall = async (rpc: ProviderWithIdentifier) => {
        try {
          await syncToElectedBlock(rpc);
          await call(rpc);
          this.updateScore(rpc.identifier, false);
        } catch (e) {
          errors.push(e as Error);
          this.updateScore(rpc.identifier, true);
        } finally {
          handleProviderResult();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.getHealthyProviders().forEach(handleProviderCall);
    });
  }
}

/**
 * It takes fields of transaction which might have change output
 * of call method
 */
const txCacheKeyBuilder = async (
  transaction: Deferrable<TransactionRequest>,
  blockTag: BlockTag
) =>
  [
    String(await transaction.chainId),
    String(await transaction.to),
    String(await transaction.from),
    await hashBytesLikeValue(transaction.data),
    JSON.stringify(await transaction.customData) || "",
    String(blockTag),
  ].join("#");
async function hashBytesLikeValue(
  data: BytesLike | undefined | Promise<BytesLike | undefined>
) {
  const awaitedData = await data;
  if (awaitedData) {
    return RedstoneCrypto.sha256ToHex(awaitedData);
  }
  return "";
}

const mapToString = (map: Map<unknown, unknown>) =>
  JSON.stringify(Object.fromEntries(map.entries()));
