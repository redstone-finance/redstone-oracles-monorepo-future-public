import { TransactionResponse } from "@ethersproject/providers";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { ethers, providers } from "ethers";
import { getProviderNetworkInfo } from "../common";
import { ProviderWithAgreement } from "../providers/ProviderWithAgreement";
import { ProviderWithFallback } from "../providers/ProviderWithFallback";
import {
  TxDelivery,
  TxDeliveryCall,
  TxDeliveryOpts,
  TxDeliverySigner,
} from "./TxDelivery";

export type TxDeliveryManSupportedProviders =
  | providers.JsonRpcProvider
  | ProviderWithAgreement
  | ProviderWithFallback;

const logger = loggerFactory("TxDeliveryMan");

export class TxDeliveryMan {
  private providers: readonly providers.JsonRpcProvider[];
  private txDeliveriesInProgress = new Map<
    providers.JsonRpcProvider,
    boolean
  >();

  constructor(
    provider: TxDeliveryManSupportedProviders,
    private signer: TxDeliverySigner,
    private opts: TxDeliveryOpts
  ) {
    this.providers = extractProviders(provider);
  }

  /**
   *
   * @param txDeliveryCall {TxDeliveryCall} - all values has to be hex values starting with 0x
   * @param deferredCallData {() => Promise<string>} - if passed is called first time on second attempt.
   * During first attempt callData from txDeliveryCall is used.
   * @returns {TransactionResponse}
   * Because we are sending concurrently many requests
   * returned transaction response doesn't have to be transaction which is actually included in chain.
   * When transaction returns it means that it was mined, however could have still reverted. Use `.wait` to
   * get more context.
   */
  async deliver(
    txDeliveryCall: TxDeliveryCall,
    deferredCallData?: () => Promise<string>
  ): Promise<TransactionResponse> {
    const deliveryPromises = this.providers.map(async (provider) => {
      const deliveryInProgress = this.txDeliveriesInProgress.get(provider);

      if (!deliveryInProgress) {
        return await this.createAndDeliverNewPackage(
          provider,
          txDeliveryCall,
          deferredCallData
        );
      } else {
        // we are okay with skipping current delivery, because we are passing
        // dynamically fetched calldata
        // This approach allows bettering separate providers errors
        const rpcUrl = getProviderNetworkInfo(provider).url;
        const message = `RpcUrl=${rpcUrl} Delivery in progress; Skipping`;
        logger.log(message);
        throw new Error(message);
      }
    });

    const fastestDelivery = await Promise.any(deliveryPromises);

    return { ...fastestDelivery, wait: buildWaitFn(deliveryPromises) };
  }

  private createAndDeliverNewPackage(
    provider: providers.JsonRpcProvider,
    txDeliveryCall: TxDeliveryCall,
    deferredCallData?: () => Promise<string>
  ) {
    const txDelivery = createTxDelivery(
      provider,
      this.signer,
      this.opts,
      deferredCallData
    );

    const deliveryPromise = txDelivery
      .deliver(txDeliveryCall)
      .finally(() => this.txDeliveriesInProgress.set(provider, false));

    this.txDeliveriesInProgress.set(provider, true);

    return deliveryPromise;
  }
}

export function extractProviders(
  provider: TxDeliveryManSupportedProviders
): readonly ethers.providers.JsonRpcProvider[] {
  if (
    provider instanceof ProviderWithFallback ||
    provider instanceof ProviderWithAgreement
  ) {
    return provider.providers as ethers.providers.JsonRpcProvider[];
  }
  return [provider];
}

function createTxDelivery(
  provider: providers.JsonRpcProvider,
  signer: TxDeliverySigner,
  opts: TxDeliveryOpts,
  deferredCallData?: () => Promise<string>
): TxDelivery {
  const rpcUrl = getProviderNetworkInfo(provider).url;
  return new TxDelivery(
    {
      ...opts,
      logger: (msg) => logger.log(`RpcUrl=${rpcUrl}, ${msg}`),
    },
    signer,
    provider,
    deferredCallData
  );
}

function buildWaitFn(deliveryPromises: Promise<TransactionResponse>[]) {
  return async (confirmations?: number) => {
    const receipts = (
      await Promise.allSettled(
        deliveryPromises.map((txResponse) =>
          txResponse.then((txResponse) =>
            RedstoneCommon.timeout(txResponse.wait(confirmations), 10_000)
          )
        )
      )
    )
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const hashes = Array.from(new Set(receipts.map((r) => r.transactionHash)));
    if (hashes.length > 1) {
      throw new Error(
        `Network between rpcs is forked - received more than one successful receipts (${receipts.length}). Possible transactions: ${hashes.join(", ")}`
      );
    } else if (receipts.length === 0) {
      throw new Error(
        "Transaction was mined but reverted with error OR we failed to fetch it"
      );
    } else {
      return receipts[0];
    }
  };
}
