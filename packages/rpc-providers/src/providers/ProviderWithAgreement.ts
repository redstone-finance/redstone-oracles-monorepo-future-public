import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { RedstoneCommon, RedstoneCrypto } from "@redstone-finance/utils";
import { BytesLike, providers, utils } from "ethers";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";
import { convertBlockTagToNumber, sleepMS } from "../common";

const BLOCK_NUMBER_TTL = 200;
// 5 min (max multiblock used)
const AGREED_RESULT_TTL = 300_000;

interface ProviderWithAgreementSpecificConfig {
  numberOfProvidersThatHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  sleepBetweenBlockSync: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
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
  sleepBetweenBlockSync: 400,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementSpecificConfig;

  constructor(
    providers: providers.Provider[],
    config: Partial<
      ProviderWithAgreementSpecificConfig & ProviderWithFallbackConfig
    > = {}
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

  private electBlockNumber = RedstoneCommon.memoize({
    functionToMemoize: async () => {
      // collect block numbers
      const blockNumbersResults = await Promise.allSettled(
        this.providers.map((provider) =>
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
    },
    ttl: BLOCK_NUMBER_TTL,
  });

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
      const electedBlockNumber = convertBlockTagToNumber(electedBlockTag);
      const errors: Error[] = [];
      const results = new Map<string, number>();
      const blockPerProvider: Record<number, number> = {};
      let stop = false;
      let finishedProvidersCount = 0;

      const syncProvider = async (providerIndex: number) => {
        while (!stop && blockPerProvider[providerIndex] < electedBlockNumber) {
          blockPerProvider[providerIndex] =
            await this.providers[providerIndex].getBlockNumber();
          await sleepMS(this.agreementConfig.sleepBetweenBlockSync);
        }
      };

      const call = async (providerIndex: number) => {
        const currentResult = await this.providers[providerIndex].call(
          transaction,
          electedBlockTag
        );
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

      const syncThenCall = async (providerIndex: number) => {
        try {
          await syncProvider(providerIndex);
          await call(providerIndex);
        } catch (e) {
          errors.push(e as Error);
        } finally {
          handleProviderResult();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.providers.forEach((_, providerIndex) => syncThenCall(providerIndex));
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
