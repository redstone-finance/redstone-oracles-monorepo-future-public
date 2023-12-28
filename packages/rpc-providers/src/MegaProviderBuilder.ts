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
import { RedstoneCommon } from "@redstone-finance/utils";
import {
  wrapCallWithMetric,
  wrapGetBlockNumberWithMetric,
} from "./MetricWrappers";
import { Point } from "@influxdata/influxdb-client";

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
  private reportMetric?: (msg: Point) => void;
  private lastIfResult: boolean = true;

  enableNextIf(conditition: boolean) {
    this.lastIfResult = conditition;
    return this;
  }

  metrics(reportMetric: (msg: Point) => void) {
    if (!this.lastIfResult) {
      this.lastIfResult = true;
      return this;
    }
    this.reportMetric = reportMetric;
    return this;
  }

  fallback(options: Partial<ProviderWithFallbackConfig>) {
    if (!this.lastIfResult) {
      this.lastIfResult = true;
      return this;
    }
    RedstoneCommon.assert(
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
    RedstoneCommon.assert(
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
    let factories = this.buildProvidersFactories();

    if (factories.length === 1) {
      const factory = this.maybeDecorateWithMetrics(factories[0]);
      return this.maybeDecorateWithMulticall(factory) as T;
    }

    factories = factories.map(this.maybeDecorateWithMetrics.bind(this));

    if (this.agreementOpts) {
      const providerWithAgreementFactory = () =>
        new ProviderWithAgreement(
          factories.map((f) => f()),
          this.agreementOpts
        );
      return this.maybeDecorateWithMulticall(providerWithAgreementFactory) as T;
    } else if (this.fallbackOpts) {
      const providerWithFallbackFactory = () =>
        new ProviderWithFallback(
          factories.map((f) => f()),
          this.fallbackOpts
        );
      return this.maybeDecorateWithMulticall(providerWithFallbackFactory) as T;
    } else {
      throw new Error(
        "You provided many RPCs but didn't choose to use agreement or fallback"
      );
    }
  }

  private maybeDecorateWithMulticall(factory: () => providers.Provider) {
    if (this.multicallOpts) {
      return withMulticall(factory, this.multicallOpts);
    } else {
      return factory();
    }
  }

  private maybeDecorateWithMetrics(
    factory: () => providers.StaticJsonRpcProvider
  ) {
    if (!this.reportMetric) {
      return factory;
    }

    const reportMetric = this.reportMetric.bind(this);

    const newFactory = wrapGetBlockNumberWithMetric(factory, reportMetric);

    return wrapCallWithMetric(newFactory, reportMetric);
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
