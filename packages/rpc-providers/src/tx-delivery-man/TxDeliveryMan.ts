import { TransactionResponse } from "@ethersproject/providers";
import { loggerFactory } from "@redstone-finance/utils";
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
  private isProviderBusy = new Map<providers.JsonRpcProvider, boolean>();

  constructor(
    provider: TxDeliveryManSupportedProviders,
    private signer: TxDeliverySigner,
    private opts: TxDeliveryOpts
  ) {
    this.providers = extractProviders(provider);
  }

  /** All values of txDeliveryCall has to be hex values */
  async deliver(txDeliveryCall: TxDeliveryCall): Promise<TransactionResponse> {
    const deliveryPromises = [];

    for (const provider of this.providers) {
      if (this.isProviderBusy.get(provider)) {
        logger.log(
          `[TxDeliveryMan] provider=${
            getProviderNetworkInfo(provider).url
          } is still delivering old transaction, skipping delivery by this provider`
        );
        continue;
      }
      const txDelivery = createTxDelivery(provider, this.signer, this.opts);

      this.isProviderBusy.set(provider, true);
      const deliveryPromise = txDelivery
        .deliver(txDeliveryCall)
        .finally(() => this.isProviderBusy.set(provider, false));

      deliveryPromises.push(deliveryPromise);
    }

    return await Promise.any(deliveryPromises);
  }
}

export function extractProviders(
  provider:
    | providers.JsonRpcProvider
    | ProviderWithFallback
    | ProviderWithAgreement
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
  opts: TxDeliveryOpts
): TxDelivery {
  const rpcUrl = getProviderNetworkInfo(provider).url;
  return new TxDelivery(
    {
      ...opts,
      logger: (msg) => logger.log(`RpcUrl=${rpcUrl}, ${msg}`),
    },
    signer,
    provider
  );
}
