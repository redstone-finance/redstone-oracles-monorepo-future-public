import { providers } from "ethers";
import {
  ProviderWithAgreementConfig,
  ProviderWithAgreement,
} from "./ProviderWithAgreement";
import {
  ProviderWithFallbackConfig,
  ProviderWithFallback,
} from "./ProviderWithFallback";
import {
  MulticallDecoratorOptions,
  withMulticall,
} from "./multicall/MulticallWrapper";
import assert from "assert";

type MegaProviderOptions = {
  rpcUrls: string[];
  network: { name: string; chainId: number };
  throttleLimit: number;
  timeout: number;
};

export class MegaProviderBuilder {
  constructor(private readonly options: MegaProviderOptions) {}

  private fallbackOpts?: Partial<ProviderWithFallbackConfig>;
  private agreementOpts?: Partial<ProviderWithAgreementConfig>;
  private multicallOpts?: MulticallDecoratorOptions;
  private lastIfResult: boolean = true;

  if(conditition: boolean) {
    this.lastIfResult = conditition;
    return this;
  }

  fallback(options: Partial<ProviderWithFallbackConfig>) {
    if (!this.lastIfResult) {
      this.lastIfResult = true;
      return this;
    }
    assert.ok(
      !this.agreementOpts,
      "You can choose agreement or fallback not both"
    );
    this.fallbackOpts = options;
    return this;
  }

  agreement(options: Partial<ProviderWithAgreementConfig>) {
    if (!this.lastIfResult) {
      this.lastIfResult = true;
      return this;
    }
    assert.ok(
      !this.fallbackOpts,
      "You can choose agreement or fallback not both"
    );
    this.agreementOpts = options;
    return this;
  }

  multicall(options: MulticallDecoratorOptions) {
    if (!this.lastIfResult) {
      this.lastIfResult = true;
      return this;
    }
    this.multicallOpts = options;
    return this;
  }

  build<T = providers.Provider>(): T {
    const factories = this.buildProvidersFactories();

    if (factories.length === 1) {
      return this.maybeDecorateWithMulticall(factories[0]) as T;
    } else if (factories.length > 1) {
      if (this.agreementOpts) {
        const providerWithAgreementFactory = () =>
          new ProviderWithAgreement(
            factories.map((f) => f()),
            this.agreementOpts
          );
        return this.maybeDecorateWithMulticall(
          providerWithAgreementFactory
        ) as T;
      } else if (this.fallbackOpts) {
        const providerWithFallbackFactory = () =>
          new ProviderWithFallback(
            factories.map((f) => f()),
            this.fallbackOpts
          );
        return this.maybeDecorateWithMulticall(
          providerWithFallbackFactory
        ) as T;
      } else {
        throw new Error(
          "You provided many RPCs but didn't choose to use agreement or fallback"
        );
      }
    } else {
      throw new Error("You have to provide at least one rpcUrl");
    }
  }

  private maybeDecorateWithMulticall(factory: () => providers.Provider) {
    if (this.multicallOpts) {
      return withMulticall(factory, this.multicallOpts);
    } else {
      return factory();
    }
  }

  private buildProvidersFactories() {
    return this.options.rpcUrls.map(
      (rpcUrl) => () =>
        new providers.StaticJsonRpcProvider(
          {
            url: rpcUrl,
            timeout: this.options.timeout,
            throttleLimit: this.options.throttleLimit,
          },
          this.options.network
        )
    );
  }
}
