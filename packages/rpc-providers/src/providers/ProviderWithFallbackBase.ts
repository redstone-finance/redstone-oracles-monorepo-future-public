import { BlockWithTransactions } from "@ethersproject/abstract-provider";
import {
  Block,
  EventType,
  FeeData,
  Listener,
  Log,
  Network,
  Provider,
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { BigNumber } from "ethers";

/** Abstract class which wraps all easy methods which can easily fallback */
export abstract class ProviderWithFallbackBase implements Provider {
  _isProvider: boolean = true;

  protected abstract executeWithFallback<T = unknown>(
    fnName: string,
    ...args: unknown[]
  ): Promise<T>;
  abstract on(eventName: EventType, listener: Listener): Provider;
  abstract once(eventName: EventType, listener: Listener): Provider;
  abstract emit(eventName: EventType, ...args: unknown[]): boolean;
  abstract listenerCount(eventName?: EventType): number;
  abstract listeners(eventName?: EventType): Listener[];
  abstract off(eventName: EventType, listener?: Listener): Provider;
  abstract removeAllListeners(eventName?: EventType): Provider;
  abstract addListener(eventName: EventType, listener: Listener): Provider;
  abstract removeListener(eventName: EventType, listener: Listener): Provider;
  abstract waitForTransaction(
    transactionHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt>;
  abstract getNetwork(): Promise<Network>;

  sendTransaction(...args: unknown[]): Promise<TransactionResponse> {
    return this.executeWithFallback("sendTransaction", ...args);
  }

  send(...args: unknown[]): Promise<unknown> {
    return this.executeWithFallback("send", ...args);
  }

  getBlockNumber(): Promise<number> {
    return this.executeWithFallback("getBlockNumber");
  }

  getGasPrice(): Promise<BigNumber> {
    return this.executeWithFallback("getGasPrice");
  }

  getFeeData(): Promise<FeeData> {
    return this.executeWithFallback("getFeeData");
  }

  getBalance(...args: unknown[]): Promise<BigNumber> {
    return this.executeWithFallback("getBalance", ...args);
  }

  getTransactionCount(...args: unknown[]): Promise<number> {
    return this.executeWithFallback("getTransactionCount", ...args);
  }

  getCode(...args: unknown[]): Promise<string> {
    return this.executeWithFallback("getCode", ...args);
  }

  getStorageAt(...args: unknown[]): Promise<string> {
    return this.executeWithFallback("getStorageAt", ...args);
  }

  /**
   * [IMPORTANT] if call returns Solidity Error (function reverts, function doesn't exist etc.)
   * It won't fallback. Because in such a case error is thrown after decoding on `Contract` interface level
   * This is expected behavior
   */
  call(...args: unknown[]): Promise<string> {
    return this.executeWithFallback("call", ...args);
  }

  estimateGas(...args: unknown[]): Promise<BigNumber> {
    return this.executeWithFallback("estimateGas", ...args);
  }

  getBlock(...args: unknown[]): Promise<Block> {
    return this.executeWithFallback("getBlock", ...args);
  }

  getBlockWithTransactions(...args: unknown[]): Promise<BlockWithTransactions> {
    return this.executeWithFallback("getBlockWithTransactions", ...args);
  }

  getTransaction(...args: unknown[]): Promise<TransactionResponse> {
    return this.executeWithFallback("getTransaction", ...args);
  }

  getTransactionReceipt(...args: unknown[]): Promise<TransactionReceipt> {
    return this.executeWithFallback("getTransactionReceipt", ...args);
  }

  getLogs(...args: unknown[]): Promise<Log[]> {
    return this.executeWithFallback("getLogs", ...args);
  }

  resolveName(...args: unknown[]): Promise<string | null> {
    return this.executeWithFallback("resolveName", ...args);
  }

  lookupAddress(...args: unknown[]): Promise<string | null> {
    return this.executeWithFallback("lookupAddress", ...args);
  }
}
