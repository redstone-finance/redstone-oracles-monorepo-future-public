import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { loggerFactory, RedstoneCommon, Tx } from "@redstone-finance/utils";
import { ethers, providers } from "ethers";
import { getProviderNetworkInfo } from "../common";
import { ProviderWithAgreement } from "../providers/ProviderWithAgreement";
import { ProviderWithFallback } from "../providers/ProviderWithFallback";
import { TxDelivery, TxDeliveryOpts, TxDeliverySigner } from "./TxDelivery";

export type TxDeliveryManSupportedProviders =
  | providers.JsonRpcProvider
  | ProviderWithAgreement
  | ProviderWithFallback;

const logger = loggerFactory("TxDeliveryMan");

export class TxDeliveryMan implements Tx.ITxDeliveryMan {
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
   * @param txDeliveryCall {TxDeliveryCall} - all values have to be hex values starting with 0x
   * @param context {deferredCallData {() => Promise<string>}} - if passed is called first time on second attempt.
   * During first attempt callData from txDeliveryCall is used.
   * @returns {TransactionResponse}
   * Because we are sending concurrently many requests
   * returned transaction response doesn't have to be transaction which is actually included in chain.
   * When transaction returns it means that it was mined, however could have still reverted. Use `.wait` to
   * get more context.
   */
  async deliver(
    txDeliveryCall: Tx.TxDeliveryCall,
    context: Tx.TxDeliveryManContext = {}
  ): Promise<TransactionResponse> {
    const deliveryPromises = this.providers.map(async (provider) => {
      const deliveryInProgress = this.txDeliveriesInProgress.get(provider);

      if (!deliveryInProgress) {
        return await this.createAndDeliverNewPackage(
          provider,
          txDeliveryCall,
          context.deferredCallData
        );
      } else {
        // we are okay with skipping current delivery, because we are passing
        // dynamically fetched calldata
        // This approach allows to better separate providers errors
        const rpcUrl = getProviderNetworkInfo(provider).url;
        const message = `RpcUrl=${rpcUrl} Delivery in progress; Skipping`;
        logger.log(message);
        throw new Error(message);
      }
    });

    const fastestDelivery = await Promise.any(deliveryPromises);

    const result = { ...fastestDelivery, wait: buildWaitFn(deliveryPromises) };
    this.logTxResponse(result);

    return result;
  }

  private logTxResponse(transactionResponse: TransactionResponse) {
    const getTxReceiptDesc = (receipt: TransactionReceipt) => {
      return `Transaction ${receipt.transactionHash} mined with SUCCESS(status: ${
        receipt.status
      }) in block #${receipt.blockNumber}[tx index: ${
        receipt.transactionIndex
      }]. gas_used=${receipt.gasUsed.toString()} effective_gas_price=${receipt.effectiveGasPrice.toString()}`;
    };

    // is not using await to not block the main function
    transactionResponse
      .wait()
      .then((receipt) => logger.log(getTxReceiptDesc(receipt), { receipt }))
      .catch((error) =>
        logger.error(
          `Failed to await transaction ${RedstoneCommon.stringifyError(error)}`
        )
      );

    logger.log(
      `Transaction tx delivered hash=${transactionResponse.hash} gasLimit=${String(
        transactionResponse.gasLimit
      )} gasPrice=${transactionResponse.gasPrice?.toString()} maxFeePerGas=${String(
        transactionResponse.maxFeePerGas
      )} maxPriorityFeePerGas=${String(transactionResponse.maxPriorityFeePerGas)}`
    );
  }

  private createAndDeliverNewPackage(
    provider: providers.JsonRpcProvider,
    txDeliveryCall: Tx.TxDeliveryCall,
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

    if (receipts.length > 1) {
      const hashes = Array.from(
        new Set(receipts.map((r) => r.transactionHash))
      );
      if (hashes.length === 1) {
        return receipts[0];
      }
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
