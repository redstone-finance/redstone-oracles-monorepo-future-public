import { ErrorCode, Logger } from "@ethersproject/logger";
import {
  EventType,
  JsonRpcProvider,
  Listener,
  Network,
  Provider,
  TransactionReceipt,
} from "@ethersproject/providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { ProviderWithFallbackBase } from "./ProviderWithFallbackBase";

const logger = Logger.globalLogger();

export type ProviderWithFallbackConfig = {
  unrecoverableErrors: ErrorCode[];
  providerNames?: string[];
  singleProviderOperationTimeout: number;
  allProvidersOperationTimeout: number;
  reportMetric: (msg: string) => void;
};

export const FALLBACK_DEFAULT_CONFIG: ProviderWithFallbackConfig = {
  unrecoverableErrors: [
    ErrorCode.MISSING_ARGUMENT,
    ErrorCode.MISSING_NEW,
    ErrorCode.NONCE_EXPIRED,
    ErrorCode.TRANSACTION_REPLACED,
    ErrorCode.REPLACEMENT_UNDERPRICED,
  ],
  singleProviderOperationTimeout: 30_000,
  allProvidersOperationTimeout: 7_000,
  reportMetric: () => {},
};

type EthersError = Error & { code?: ErrorCode; reason?: string };
export class ProviderWithFallback
  extends ProviderWithFallbackBase
  implements Provider
{
  public readonly providers: Provider[];
  protected readonly providerWithFallbackConfig: ProviderWithFallbackConfig;
  private currentProvider: Provider;
  private providerIndex = 0;

  getCurrentProviderIndex(): number {
    return this.providerIndex;
  }

  getProviderWithFallbackConfig() {
    return { ...this.providerWithFallbackConfig };
  }

  private globalListeners: {
    eventType: EventType;
    listener: Listener;
    once: boolean;
  }[] = [];

  constructor(
    providers: JsonRpcProvider[],
    config: Partial<ProviderWithFallbackConfig> = {}
  ) {
    super();
    if (providers.length < 2) {
      throw new Error("Please provide at least two providers");
    }

    const mainProvider = providers[0];
    this.currentProvider = mainProvider;
    this.providers = [...providers];
    this.providerWithFallbackConfig = { ...FALLBACK_DEFAULT_CONFIG, ...config };
  }

  override getNetwork(): Promise<Network> {
    return this.currentProvider.getNetwork();
  }

  override on(eventName: EventType, listener: Listener): Provider {
    this.saveGlobalListener(eventName, listener);
    return this.currentProvider.on(eventName, listener);
  }

  override once(eventName: EventType, listener: Listener): Provider {
    this.saveGlobalListener(eventName, listener);
    return this.currentProvider.once(eventName, listener);
  }

  override emit(eventName: EventType, ...args: unknown[]): boolean {
    return this.currentProvider.emit(eventName, ...args);
  }

  override listenerCount(eventName?: EventType): number {
    return this.currentProvider.listenerCount(eventName);
  }

  override listeners(eventName?: EventType): Listener[] {
    return this.currentProvider.listeners(eventName);
  }

  override addListener(eventName: EventType, listener: Listener): Provider {
    return this.currentProvider.addListener(eventName, listener);
  }

  override off(eventName: EventType, listener?: Listener): Provider {
    this.currentProvider.off(eventName, listener);
    this.updateGlobalListenerAfterRemoval();

    return this.currentProvider;
  }

  override removeAllListeners(eventName?: EventType): Provider {
    this.currentProvider.removeAllListeners(eventName);
    this.updateGlobalListenerAfterRemoval();

    return this.currentProvider;
  }

  override removeListener(eventName: EventType, listener: Listener): Provider {
    this.currentProvider.removeListener(eventName, listener);
    this.updateGlobalListenerAfterRemoval();

    return this.currentProvider;
  }

  override waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    return this.currentProvider.waitForTransaction(
      transactionHash,
      confirmations,
      timeout
    );
  }

  private saveGlobalListener(
    eventType: EventType,
    listener: Listener,
    once = false
  ) {
    this.globalListeners.push({ eventType, listener, once });
  }

  /**
   * To avoid copying logic of removing events from BaseProvider.
   * Just remove listeners which were removed from _currentProvider
   */
  private updateGlobalListenerAfterRemoval() {
    const allCurrentListeners = this.currentProvider.listeners();
    for (let i = 0; i < this.globalListeners.length; i++) {
      if (!allCurrentListeners.includes(this.globalListeners[i].listener)) {
        this.globalListeners.splice(i, 1);
      }
    }
  }

  protected override executeWithFallback<T = unknown>(
    fnName: string,
    ...args: unknown[]
  ): Promise<T> {
    return RedstoneCommon.timeout<T>(
      this.doExecuteWithFallback<T>(0, this.providerIndex, fnName, ...args),
      this.providerWithFallbackConfig.allProvidersOperationTimeout,
      `executeWithFallback(${fnName}) timeout after ${this.providerWithFallbackConfig.allProvidersOperationTimeout}`
    );
  }

  private async doExecuteWithFallback<T = unknown>(
    alreadyRetriedCount: number,
    lastProviderUsedIndex: number,
    fnName: string,
    ...args: unknown[]
  ): Promise<T> {
    try {
      return await RedstoneCommon.timeout(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/return-await, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        (this.currentProvider as any)[fnName](...args),
        this.providerWithFallbackConfig.singleProviderOperationTimeout
      );
    } catch (error: unknown) {
      this.electNewProviderOrFail(
        error as EthersError,
        alreadyRetriedCount,
        lastProviderUsedIndex
      );
      return await this.doExecuteWithFallback(
        alreadyRetriedCount + 1,
        this.providerIndex,
        fnName,
        ...args
      );
    }
  }

  private useProvider(providerIndex: number) {
    this.currentProvider.removeAllListeners();
    this.providerIndex = providerIndex;
    const newProvider = this.providers[this.providerIndex];
    this.currentProvider = newProvider;

    for (const { listener, once, eventType } of this.globalListeners) {
      if (once) {
        this.currentProvider.once(eventType, listener);
      } else {
        this.currentProvider.on(eventType, listener);
      }
    }
  }

  private extractProviderName(index: number): string {
    return (
      this.providerWithFallbackConfig.providerNames?.[index] ?? index.toString()
    );
  }

  private electNewProviderOrFail(
    error: EthersError,
    retryNumber: number,
    lastUsedProviderIndex: number
  ): void {
    const providerName = this.extractProviderName(this.providerIndex);

    if (
      error.code &&
      this.providerWithFallbackConfig.unrecoverableErrors.includes(error.code)
    ) {
      logger.warn(`Unrecoverable error ${error.code}, rethrowing error`);
      throw error;
    }

    logger.warn(
      `Provider ${providerName} failed with error: ${error.code} ${error.message}`
    );

    if (retryNumber === this.providers.length - 1) {
      logger.warn(`All providers failed to execute action, rethrowing error`);
      throw error;
    }

    // if another concurrent request already has changed provider we do nothing
    if (lastUsedProviderIndex !== this.providerIndex) {
      return;
    }

    const nextProviderIndex = (this.providerIndex + 1) % this.providers.length;
    const nextProviderName = this.extractProviderName(nextProviderIndex);

    logger.info(
      `Fallback in to next provider ${nextProviderName} (${nextProviderIndex}/${this.providers.length}).`
    );

    this.useProvider(nextProviderIndex);
  }
}
