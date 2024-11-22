import {
  DataPackageSubscriber,
  Mqtt5Client,
  MqttTopics,
  MultiPubSubClient,
  RateLimitsCircuitBreaker,
} from "@redstone-finance/mqtt5-client";
import {
  chooseDataPackagesTimestamp,
  ContractParamsProvider,
  DataPackagesRequestParams,
  DataPackagesResponse,
  DataPackagesResponseCache,
} from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import _ from "lodash";
import { config } from "../config";
import {
  canIgnoreMissingFeeds,
  makeDataPackagesRequestParams,
} from "../core/make-data-packages-request-params";
import { ContractFacade } from "../facade/ContractFacade";
import { getContractFacade } from "../facade/get-contract-facade";
import { runIteration } from "../run-iteration";
import { RelayerConfig } from "../types";
import { OperationQueue } from "./OperationQueue";

export class MqttRunner {
  private subscriber?: DataPackageSubscriber;
  private queue = new OperationQueue();
  private fallbackInterval?: NodeJS.Timeout;
  private readonly logger = loggerFactory("relayer/mqtt-runner");
  private readonly rateLimitCircuitBreaker = new RateLimitsCircuitBreaker(
    1_000,
    10_000
  );

  constructor(
    private readonly client: MultiPubSubClient,
    private readonly contractFacade: ContractFacade,
    private readonly cache: DataPackagesResponseCache
  ) {}

  static async run(relayerConfig: RelayerConfig) {
    if (
      !relayerConfig.mqttEndpoint ||
      !relayerConfig.mqttUpdateSubscriptionIntervalMs
    ) {
      throw new Error(
        "Relayer is going to run with mqtt but mqttEndpoint or mqttUpdateSubscriptionIntervalMs is not set"
      );
    }

    const cache = new DataPackagesResponseCache();
    const contractFacade = await getContractFacade(relayerConfig, cache);
    const mqttClientFactory = () =>
      Mqtt5Client.create({
        endpoint: relayerConfig.mqttEndpoint!,
        authorization: {
          type: "AWSSigV4",
        },
      });

    const multiClient = new MultiPubSubClient(
      mqttClientFactory,
      MqttTopics.calculateTopicCountPerConnection()
    );

    const runner = new MqttRunner(multiClient, contractFacade, cache);
    await runner.updateSubscription();

    if (relayerConfig.mqttUpdateSubscriptionIntervalMs > 0) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setInterval(async () => {
        await runner.updateSubscription();
      }, relayerConfig.mqttUpdateSubscriptionIntervalMs);
    }

    return runner;
  }

  private async updateSubscription() {
    try {
      const blockTag = await this.contractFacade.getBlockNumber();
      const uniqueSignersThreshold =
        await this.contractFacade.getUniqueSignersThresholdFromContract(
          blockTag
        );

      const relayerConfig = config();
      const requestParams = makeDataPackagesRequestParams(
        relayerConfig,
        uniqueSignersThreshold
      );

      this.logger.debug("Checking subscription", requestParams);

      await this.subscribe(requestParams, relayerConfig);
    } catch (error) {
      this.logger.error(
        "Failed to check subscription",
        RedstoneCommon.stringifyError(error)
      );
    }
  }

  private async subscribe(
    requestParams: DataPackagesRequestParams,
    relayerConfig: RelayerConfig
  ) {
    if (
      !relayerConfig.mqttMinimalOffChainSignersCount ||
      !relayerConfig.mqttWaitForOtherSignersMs
    ) {
      throw new Error(
        "Relayer is going to update mqtt subscription but mqttMinimalOffChainSignersCount or mqttWaitMsForOtherSignersMs is not set"
      );
    }

    const params = {
      dataServiceId: requestParams.dataServiceId,
      dataPackageIds: requestParams.dataPackagesIds,
      uniqueSignersCount: requestParams.uniqueSignersCount,
      minimalOffChainSignersCount:
        relayerConfig.mqttMinimalOffChainSignersCount,
      waitMsForOtherSignersAfterMinimalSignersCountSatisfied:
        relayerConfig.mqttWaitForOtherSignersMs,
      ignoreMissingFeeds: canIgnoreMissingFeeds(relayerConfig),
      authorizedSigners: requestParams.authorizedSigners ?? [],
    };

    if (_.isEqual(params, this.subscriber?.params)) {
      return this.logger.debug(
        "Params remain unchanged, doesn't need to resubscribe"
      );
    }

    this.logger.info("Subscribing...", params);

    await this.subscriber?.unsubscribe();
    this.subscriber?.disableFallback();

    this.subscriber = new DataPackageSubscriber(this.client, params);
    this.maybeEnableFallback(relayerConfig, requestParams);
    this.subscriber.enableCircuitBreaker(this.rateLimitCircuitBreaker);

    await this.subscriber.subscribe(
      (dataPackagesResponse: DataPackagesResponse) => {
        this.processResponse(dataPackagesResponse, requestParams);
      }
    );
  }

  private maybeEnableFallback(
    relayerConfig: RelayerConfig,
    requestParams: DataPackagesRequestParams
  ) {
    if (
      !relayerConfig.mqttFallbackCheckIntervalMs ||
      !relayerConfig.mqttFallbackMaxDelayBetweenPublishesMs
    ) {
      return this.logger.warn(
        `Fallback IS NOT enabled. mqttFallbackCheckIntervalMs or mqttFallbackMaxDelayBetweenPublishesMs is missing`
      );
    }

    this.subscriber!.enableFallback(
      async () =>
        await new ContractParamsProvider(requestParams).requestDataPackages(),
      relayerConfig.mqttFallbackMaxDelayBetweenPublishesMs,
      relayerConfig.mqttFallbackCheckIntervalMs
    );
  }

  private processResponse(
    dataPackagesResponse: DataPackagesResponse,
    requestParams: DataPackagesRequestParams
  ) {
    const dataPackageIds = Object.keys(dataPackagesResponse);
    dataPackageIds.sort();

    this.logger.debug(
      `Got data for [${dataPackageIds.toString()}], timestamp: ${chooseDataPackagesTimestamp(dataPackagesResponse)}`
    );

    const wasEnqueued = this.queue.enqueue(dataPackageIds.toString(), () =>
      this.runIteration(dataPackagesResponse, requestParams)
    );

    if (!wasEnqueued) {
      this.cache.update(dataPackagesResponse, requestParams);
    }
  }

  private async runIteration(
    dataPackagesResponse: DataPackagesResponse,
    requestParams: DataPackagesRequestParams
  ) {
    try {
      this.cache.update(dataPackagesResponse, requestParams);
      await runIteration(this.contractFacade);
    } catch (error) {
      this.logger.error(
        "Unhandled error occurred during iteration:",
        RedstoneCommon.stringifyError(error)
      );
    }
  }
}
