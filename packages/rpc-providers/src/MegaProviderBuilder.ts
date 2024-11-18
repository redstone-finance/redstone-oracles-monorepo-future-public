import { RedstoneCommon } from "@redstone-finance/utils";
import { providers } from "ethers";
import {
  ProviderWithAgreement,
  ProviderWithAgreementConfig,
} from "./providers/ProviderWithAgreement";
import { ProviderWithFallback } from "./providers/ProviderWithFallback";

type MegaProviderOptions = {
  rpcUrls: readonly string[];
  network: { name: string; chainId: number };
  throttleLimit: number;
  timeout: number;
  pollingInterval?: number;
};

type ProviderFactory = () => providers.Provider;

type Decorator = (factory: ProviderFactory) => ProviderFactory;

export class MegaProviderBuilder {
  private factories: ProviderFactory[];

  constructor(private readonly options: MegaProviderOptions) {
    this.factories = this.buildProvidersFactories();
  }

  addDecorator(decorator: Decorator, addIf = true) {
    if (addIf) {
      this.factories = this.factories.map(decorator);
    }
    return this;
  }

  agreement(opts: ProviderWithAgreementConfig, addIf = true) {
    if (addIf) {
      const agreementProvider = new ProviderWithAgreement(
        this.factories.map((f) => f()),
        opts
      );
      this.factories = [() => agreementProvider];
    }
    return this;
  }

  fallback(opts: ProviderWithAgreementConfig, addIf = true) {
    if (addIf) {
      const fallbackProvider = new ProviderWithFallback(
        this.factories.map((f) => f()),
        opts
      );
      this.factories = [() => fallbackProvider];
    }
    return this;
  }

  build<T extends providers.Provider>() {
    RedstoneCommon.assert(
      this.factories.length === 1,
      `MegaProviderBuilder should always return a single provider. Please use agreement or fallback option. Options used ${JSON.stringify(this.options)}`
    );

    return this.factories[0]() as T;
  }

  private buildProvidersFactories(): ProviderFactory[] {
    return this.options.rpcUrls.map((rpcUrl) => () => {
      const provider = new providers.StaticJsonRpcProvider(
        {
          url: rpcUrl,
          timeout: this.options.timeout,
          throttleLimit: this.options.throttleLimit,
        },
        this.options.network
      );
      if (this.options.pollingInterval) {
        provider.pollingInterval = this.options.pollingInterval;
      }
      return provider;
    });
  }
}
