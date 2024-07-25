import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import {
  RedstoneCommon,
  RedstoneLogger,
  loggerFactory,
} from "@redstone-finance/utils";
import { BigNumber, providers, utils } from "ethers";
import _ from "lodash";
import { convertBlockTagToNumber, getProviderNetworkInfo } from "../common";
import { CuratedRpcList, RpcIdentifier } from "./CuratedRpcList";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

const MAX_BLOCK_TIME_AHEAD_HOURS = 72;

interface ProviderWithAgreementSpecificConfig {
  numberOfProvidersThatHaveToAgree: number;
  minimalProvidersCount: number;
  getBlockNumberTimeoutMS: number;
  ignoreAgreementOnInsufficientResponses: boolean;
  electBlockFn: (
    blockNumbers: number[],
    healthyProvidersCount: number,
    chainId: number
  ) => number;
  enableRpcCuratedList: boolean;
  requireExplicitBlockTag: boolean;
}

export type ProviderWithAgreementConfig = Partial<
  ProviderWithAgreementSpecificConfig & ProviderWithFallbackConfig
>;

const DEFAULT_ELECT_BLOCK_FN = (blockNumbers: number[]): number => {
  blockNumbers.sort((a, b) => a - b);
  const mid = Math.floor(blockNumbers.length / 2);

  return blockNumbers.length % 2 !== 0
    ? blockNumbers[mid]
    : Math.round((blockNumbers[mid - 1] + blockNumbers[mid]) / 2);
};

const defaultConfig: ProviderWithAgreementSpecificConfig = {
  ignoreAgreementOnInsufficientResponses: false,
  numberOfProvidersThatHaveToAgree: 2,
  getBlockNumberTimeoutMS: 1_500,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
  enableRpcCuratedList: false,
  minimalProvidersCount: 3,
  requireExplicitBlockTag: true,
};

type ProviderWithIdentifier = {
  provider: providers.Provider;
  identifier: string;
};

export class ProviderWithAgreement extends ProviderWithFallback {
  readonly agreementConfig: ProviderWithAgreementSpecificConfig;
  readonly curatedRpcList?: CuratedRpcList;
  readonly providersWithIdentifier: readonly ProviderWithIdentifier[];
  readonly lastBlockNumberForProvider: Record<string, number | undefined> = {};
  readonly logger: RedstoneLogger;

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

    this.validateProvidersCount(numberOfProvidersThatHaveToAgree, providers);

    this.providersWithIdentifier = Object.freeze(
      this.providers.map((provider, index) => ({
        provider,
        identifier: getProviderNetworkInfo(provider, {
          url: index.toString(),
          chainId: 1,
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
        this.chainId
      );
    }

    this.logger = loggerFactory(`ProviderWithAgreement-${this.chainId}`);
  }

  private validateProvidersCount(
    numberOfProvidersThatHaveToAgree: number,
    providers: providers.Provider[]
  ) {
    if (providers.length < 2) {
      throw new Error("Please provide at least two providers");
    }

    if (numberOfProvidersThatHaveToAgree > this.providers.length) {
      throw new Error(
        "numberOfProvidersWhichHaveToAgree should be greater then supplied providers count"
      );
    }
  }

  /** MUST always return shallow copy */
  getHealthyProviders(): readonly ProviderWithIdentifier[] {
    if (!this.curatedRpcList) {
      return [...this.providersWithIdentifier];
    }
    const chosenProviderIdentifiers = this.curatedRpcList.getBestProviders();

    return this.providersWithIdentifier.filter(({ identifier }) =>
      chosenProviderIdentifiers.includes(identifier)
    );
  }

  updateScore(identifier: RpcIdentifier, error: boolean) {
    if (this.curatedRpcList) {
      this.curatedRpcList.scoreRpc(identifier, { error });
    }
  }

  override async getBlockNumber(): Promise<number> {
    const healthyProviders = this.getHealthyProviders();

    const blockNumbersResults = await Promise.allSettled(
      healthyProviders.map(async ({ provider, identifier }) => {
        const blockNumber = await RedstoneCommon.timeout(
          withDebugLog(() => provider.getBlockNumber(), {
            description: `rpc=${identifier} op=getBlockNumber`,
            logValue: true,
            logger: this.logger,
          }),
          this.agreementConfig.getBlockNumberTimeoutMS
        );
        this.assertValidBlockNumber(blockNumber, identifier);
        this.lastBlockNumberForProvider[identifier] = blockNumber;
        return blockNumber;
      })
    );

    const blockNumbers = blockNumbersResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    if (blockNumbers.length === 0) {
      throw new AggregateError(
        blockNumbersResults.map(
          (result, index) =>
            new Error(
              `${healthyProviders[index].identifier}: ${String((result as PromiseRejectedResult).reason)}`
            )
        ),
        `All providers failed to fetch 'getBlockNumber'`
      );
    }

    const electedBlockNumber = this.agreementConfig.electBlockFn(
      blockNumbers,
      healthyProviders.length,
      this.chainId
    );

    this.logger.debug("block number election", {
      blockNumbers,
      electedBlockNumber,
    });

    return electedBlockNumber;
  }

  override async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ): Promise<string> {
    RedstoneCommon.assert(
      blockTag || !this.agreementConfig.requireExplicitBlockTag,
      "When using providerWithAgreement, blockTag has to be passed explicitly"
    );
    blockTag ??= await this.getBlockNumber();
    const electedBlockTag = utils.hexlify(blockTag);

    const callResult = RedstoneCommon.timeout(
      this.executeCallWithAgreement(transaction, electedBlockTag),
      this.providerWithFallbackConfig.allProvidersOperationTimeout,
      `Agreement provider after ${this.providerWithFallbackConfig.allProvidersOperationTimeout} [ms] during call`
    );

    return await callResult;
  }

  override async getBalance(
    address: string,
    blockTag?: BlockTag
  ): Promise<BigNumber> {
    RedstoneCommon.assert(
      blockTag || !this.agreementConfig.requireExplicitBlockTag,
      "When using providerWithAgreement, blockTag has to be passed explicitly"
    );
    blockTag ??= await this.getBlockNumber();
    const getBalance = ({ provider }: ProviderWithIdentifier) =>
      provider.getBalance(address, blockTag).then((r) => r.toString());

    const agreedResult = await this.executeWithAgreement(
      getBalance,
      "getBalance"
    );

    const parsedResult = BigNumber.from(agreedResult);

    return parsedResult;
  }

  private assertValidBlockNumber(
    blockNumber: number,
    providerIdentifier: string
  ) {
    const prevBlockNumber = this.lastBlockNumberForProvider[providerIdentifier];
    if (prevBlockNumber) {
      RedstoneCommon.assert(
        prevBlockNumber <= blockNumber,
        `provider=${providerIdentifier} returned block_number=${blockNumber} previous_one=${prevBlockNumber}, block_number can't be < previous_one`
      );
      RedstoneCommon.assert(
        (blockNumber - prevBlockNumber) * this.chainConfig.avgBlockTimeMs <
          RedstoneCommon.hourToMs(MAX_BLOCK_TIME_AHEAD_HOURS),
        `provider=${providerIdentifier} returned block_number=${blockNumber} previous_one=${prevBlockNumber}, blockNumber can't be ahead more than ${MAX_BLOCK_TIME_AHEAD_HOURS} hours from previous one`
      );
    }
  }

  private async executeCallWithAgreement(
    transaction: Deferrable<TransactionRequest>,
    electedBlockTag: BlockTag
  ): Promise<string> {
    const electedBlockNumber = convertBlockTagToNumber(electedBlockTag);

    const syncThenCall = async (
      { provider, identifier }: ProviderWithIdentifier,
      shouldAbort: () => boolean
    ) => {
      while (
        !shouldAbort() &&
        (await provider.getBlockNumber()) < electedBlockNumber
      ) {
        await RedstoneCommon.sleep(500);
      }
      if (shouldAbort()) {
        throw new Error(
          `Provider ${identifier} failed to sync to block ${electedBlockNumber}`
        );
      }

      return await provider.call(transaction, electedBlockTag);
    };

    const agreedResult = await this.executeWithAgreement(syncThenCall, "call");

    return agreedResult.toString();
  }

  private executeWithAgreement(
    operation: (
      provider: ProviderWithIdentifier,
      shouldAbort: () => boolean
    ) => Promise<string>,
    operationName: string
  ) {
    return new Promise<string>((resolve, reject) => {
      const errors: Error[] = [];
      const results = new Map<string, number>();
      let globalAbort = false;
      let finishedProvidersCount = 0;

      const healthyProviders = this.getHealthyProviders();

      const executeOperation = async (provider: ProviderWithIdentifier) => {
        const currentResult = await this.executeOperation(
          operation,
          provider,
          () => globalAbort,
          operationName
        );

        const currentResultCount = results.get(currentResult);

        if (currentResultCount) {
          results.set(currentResult, currentResultCount + 1);
          // we have found satisfying number of same responses
          if (
            currentResultCount + 1 >=
            this.agreementConfig.numberOfProvidersThatHaveToAgree
          ) {
            globalAbort = true;
            resolve(currentResult);
          }
        } else {
          results.set(currentResult, 1);
        }
      };

      const handleProviderResult = () => {
        finishedProvidersCount++;
        if (finishedProvidersCount === healthyProviders.length) {
          globalAbort = true;
          if (
            this.agreementConfig.ignoreAgreementOnInsufficientResponses &&
            results.size > 0
          ) {
            resolve(pickResponseWithMostVotes(results));
          } else {
            reject(
              new AggregateError(
                errors,
                `operation=${operationName} Failed to find at least ${
                  this.agreementConfig.numberOfProvidersThatHaveToAgree
                } agreeing providers. ${
                  healthyProviders.length - errors.length
                } providers responded with success. Result map: ${mapToString(
                  results
                )}`
              )
            );
          }
        }
      };

      const executeOperationOnProvider = async (
        rpc: ProviderWithIdentifier
      ) => {
        try {
          await withDebugLog(() => executeOperation(rpc), {
            description: `rpc=${rpc.identifier} op=${operationName}`,
            logger: this.logger,
            logValue: false,
          });
          this.updateScore(rpc.identifier, false);
        } catch (e) {
          errors.push(e as Error);
          this.updateScore(rpc.identifier, true);
        } finally {
          handleProviderResult();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      healthyProviders.forEach(executeOperationOnProvider);
    });
  }

  private async executeOperation(
    operation: (
      provider: ProviderWithIdentifier,
      shouldAbort: () => boolean
    ) => Promise<string>,
    provider: ProviderWithIdentifier,
    globalAbort: () => boolean,
    operationName: string
  ) {
    let singleProviderAbort = false;
    const shouldAbort = () => globalAbort() || singleProviderAbort;
    try {
      return await RedstoneCommon.timeout(
        operation(provider, shouldAbort),
        this.providerWithFallbackConfig.singleProviderOperationTimeout,
        `provider=${provider.identifier} ${operationName} timeout after ${this.providerWithFallbackConfig.singleProviderOperationTimeout}`
      );
    } catch (e) {
      singleProviderAbort = true;
      throw e;
    }
  }
}

const mapToString = (map: Map<unknown, unknown>) =>
  JSON.stringify(Object.fromEntries(map.entries()));

// We are passing op as function instead of promise to measure also synchronous operation time
async function withDebugLog<T>(
  op: () => Promise<T>,
  opts = {
    logValue: false,
    description: "",
    logger: loggerFactory("defaultLogger"),
  }
) {
  const start = performance.now();

  try {
    const result = await op();
    opts.logger.debug(`${opts.description}`, {
      duration: performance.now() - start,
      value: opts.logValue ? result : "hidden",
    });
    return result;
  } catch (e) {
    opts.logger.debug(`${opts.description}`, {
      duration: performance.now() - start,
      error: "error",
    });
    throw e;
  }
}

function pickResponseWithMostVotes(dataToVotes: Map<string, number>): string {
  const best = _.maxBy(
    [...dataToVotes.entries()],
    ([_data, voteCount]) => voteCount
  );

  return RedstoneCommon.assertThenReturn(
    best?.[0],
    "pickResponseWithMostVotes expect as least one entry in map"
  );
}
