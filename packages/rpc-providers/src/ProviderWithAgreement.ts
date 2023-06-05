import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { sleepMS, timeout } from "./common";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

const ERROR_GET_BLOCK_NUMBER_VALUE = -1;

export interface ProviderWithAgreementConfig {
  numberOfProvidersThatHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  sleepBetweenBlockSync: number;
  blockNumberCacheTTLInMS: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
}

const DEFAULT_ELECT_BLOCK_FN = (blockNumbers: number[]): number => {
  const mid = Math.floor(blockNumbers.length / 2);
  blockNumbers.sort((a, b) => a - b);

  return blockNumbers.length % 2 !== 0
    ? blockNumbers[mid]
    : Math.round((blockNumbers[mid - 1] + blockNumbers[mid]) / 2);
};

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersThatHaveToAgree: 2,
  getBlockNumberTimeoutMS: 1_000,
  sleepBetweenBlockSync: 100,
  blockNumberCacheTTLInMS: 50,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementConfig;

  constructor(
    providers: JsonRpcProvider[],
    config: Partial<
      ProviderWithAgreementConfig & ProviderWithFallbackConfig
    > = {}
  ) {
    super(providers, config);
    this.agreementConfig = {
      ...defaultConfig,
      ...config,
    };
    const numberOfProvidersThatHaveToAgree =
      this.agreementConfig.numberOfProvidersThatHaveToAgree;
    if (
      numberOfProvidersThatHaveToAgree < 2 ||
      numberOfProvidersThatHaveToAgree > this.providers.length
    ) {
      throw new Error(
        "numberOfProvidersWhichHaveToAgree should be >= 2 and > then supplied providers count"
      );
    }
  }

  override async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ): Promise<string> {
    const electedBlockTag = utils.hexlify(
      blockTag ?? (await this.getBlockNumber())
    );
    const callResult = this.executeCallWithAgreement(
      transaction,
      electedBlockTag
    );

    return callResult;
  }

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
      let handledResults = 0;

      const syncProvider = async (providerIndex: number) => {
        while (
          blockPerProvider[providerIndex] !== ERROR_GET_BLOCK_NUMBER_VALUE &&
          !stop &&
          blockPerProvider[providerIndex] < electedBlockNumber
        ) {
          blockPerProvider[providerIndex] = await this.providers[providerIndex]
            .getBlockNumber()
            // if providers fails at least once we don't want to use it
            .catch(() => ERROR_GET_BLOCK_NUMBER_VALUE);
          await sleepMS(this.agreementConfig.sleepBetweenBlockSync);
        }
      };

      const call = async (providerIndex: number) => {
        try {
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
        } catch (e: any) {
          errors.push(e);
        }
      };

      const syncThenCall = async (providerIndex: number) => {
        await syncProvider(providerIndex);
        await call(providerIndex);
        handledResults++;
        if (handledResults === this.providers.length) {
          stop = true;
          reject(
            new AggregateError(
              errors,
              `Failed to find at least ${this.agreementConfig.numberOfProvidersThatHaveToAgree} agreeing providers.`
            )
          );
        }
      };

      this.providers.forEach((_, providerIndex) => syncThenCall(providerIndex));
    });
  }
}

const convertBlockTagToNumber = (blockTag: BlockTag): number =>
  typeof blockTag === "string" ? convertHexToNumber(blockTag) : blockTag;

const convertHexToNumber = (hex: string): number => {
  const number = Number.parseInt(hex, 16);
  if (Number.isNaN(number)) {
    throw new Error(`Failed to parse ${hex} to number`);
  }
  return number;
};
