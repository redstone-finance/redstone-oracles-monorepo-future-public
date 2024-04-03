import { TransactionResponse } from "@ethersproject/providers";
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

export class TxDeliveryMan {
  private providers: readonly providers.JsonRpcProvider[];

  constructor(
    provider: TxDeliveryManSupportedProviders,
    private signer: TxDeliverySigner,
    private opts: TxDeliveryOpts
  ) {
    this.providers = extractProviders(provider);
  }

  async deliver(txDeliveryCall: TxDeliveryCall): Promise<TransactionResponse> {
    const deliveryPromises = [];

    for (const provider of this.providers) {
      const txDelivery = createTxDelivery(provider, this.signer, this.opts);

      const deliveryPromise = txDelivery.deliver(txDeliveryCall);

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
      logger: (msg) => console.log(`[TxDelivery rpcUrl=${rpcUrl}] ${msg}`),
    },
    signer,
    provider
  );
}
