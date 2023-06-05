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

  protected abstract executeWithFallback(
    fnName: string,
    ...args: any[]
  ): Promise<any>;
  abstract getNetwork(): Promise<Network>;
  abstract on(eventName: EventType, listener: Listener): Provider;
  abstract once(eventName: EventType, listener: Listener): Provider;
  abstract emit(eventName: EventType, ...args: any[]): boolean;
  abstract listenerCount(eventName?: EventType | undefined): number;
  abstract listeners(eventName?: EventType | undefined): Listener[];
  abstract off(eventName: EventType, listener?: Listener | undefined): Provider;
  abstract removeAllListeners(eventName?: EventType | undefined): Provider;
  abstract addListener(eventName: EventType, listener: Listener): Provider;
  abstract removeListener(eventName: EventType, listener: Listener): Provider;
  abstract waitForTransaction(
    transactionHash: string,
    confirmations?: number | undefined,
    timeout?: number | undefined
  ): Promise<TransactionReceipt>;

  sendTransaction(...args: any[]): Promise<TransactionResponse> {
    return this.executeWithFallback("sendTransaction", ...args);
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

  getBalance(...args: any[]): Promise<BigNumber> {
    return this.executeWithFallback("getBalance", ...args);
  }

  getTransactionCount(...args: any[]): Promise<number> {
    return this.executeWithFallback("getTransactionCount", ...args);
  }

  getCode(...args: any[]): Promise<string> {
    return this.executeWithFallback("getCode", ...args);
  }

  getStorageAt(...args: any[]): Promise<string> {
    return this.executeWithFallback("getStorageAt", ...args);
  }

  call(...args: any[]): Promise<string> {
    return this.executeWithFallback("call", ...args);
  }

  estimateGas(...args: any[]): Promise<BigNumber> {
    return this.executeWithFallback("estimateGas", ...args);
  }

  getBlock(...args: any[]): Promise<Block> {
    return this.executeWithFallback("getBlock", ...args);
  }

  getBlockWithTransactions(...args: any[]): Promise<BlockWithTransactions> {
    return this.executeWithFallback("getBlockWithTransactions", ...args);
  }

  getTransaction(...args: any[]): Promise<TransactionResponse> {
    return this.executeWithFallback("getTransaction", ...args);
  }

  getTransactionReceipt(...args: any[]): Promise<TransactionReceipt> {
    return this.executeWithFallback("getTransactionReceipt", ...args);
  }

  getLogs(...args: any[]): Promise<Log[]> {
    return this.executeWithFallback("getLogs", ...args);
  }

  resolveName(...args: any[]): Promise<string | null> {
    return this.executeWithFallback("resolveName", ...args);
  }

  lookupAddress(...args: any[]): Promise<string | null> {
    return this.executeWithFallback("lookupAddress", ...args);
  }
}
