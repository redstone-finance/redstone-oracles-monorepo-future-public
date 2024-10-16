import { Mqtt5Client, MqttTopics } from "@redstone-finance/mqtt5-client";
import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { pickDataFeedPackagesClosestToMedian } from "./pick-closest-to-median";
import { RateLimitsCircuitBreaker } from "./RateLimitsCircuitBreaker";
import {
  DataPackagesResponse,
  SignedDataPackageSchema,
} from "./request-data-packages";

const MAX_DELAY = RedstoneCommon.minToMs(3);

/**
 * defines behavior of {@link DataPackageSubscriber}
 */
export type DataPackageSubscriberParams = {
  /**
   * for production environment most of the time "redstone-primary-prod" is appropriate
   */
  dataServiceId: string;
  /**
   * array of tokens to fetch
   */
  dataPackageIds: string[];
  /**
   * ensure minimum number of signers for each token - throws if there are less signers for any token
   */
  uniqueSignersCount: number;

  /**
   * has to be >= uniqueSignersCount
   * specify minimal number of signers per package which have to be aggregated before publishing
   */
  minimalOffChainSignersCount: number;

  /**
   * time which we will wait for additional packages after minimal requirements are satisfied
   */
  waitMsForOtherSignersAfterMinimalSignersCountSatisfied: number;

  /**
   * if set to true, it is enough that minimal requirements are satisfied for single package and all will be published
   */
  ignoreMissingFeeds: boolean;

  /**
   * List of signers from which packages will be accepted
   */
  authorizedSigners: string[];
};

type SubscriptionCallbackFn = (dataPackages: DataPackagesResponse) => unknown;

/**
 * The DataPackageSubscriber class is responsible for aggregation and verification of packages broadcasted via mqtt.
 * The implementation MUST include all checks from {@link requestDataPackages}
 *
 * ## Behavior
 *
 * 1. Validation:
 * - Validates incoming packages against a schema
 * - Verifies signer authorization
 * - Rejects packages with timestamps <= last published timestamp
 * - Prevents duplicate packages from the same signer for a given timestamp
 *
 * 2. Package processing:
 * - Publishes immediately if packages from all signers are received
 * - Schedules delayed publication if `minimalOffChainSignersCount` is met
 * - Uses `ignoreMissingFeeds` to determine if all or some dataPackageIds must meet criteria
 * - NEVER publishes a package with the same timestamp or older than the last published
 *
 * 3. Package selection:
 * - Employs `pickDataFeedPackagesClosestToMedian` to select `uniqueSignersCount` packages
 *
 * 4. Fallback mechanism (optional) {@link DataPackageSubscriber.enableFallback}
 * - Triggers if no packages are received within `maxDelayBetweenPublishes`
 * - Fetches packages via `fallbackFn` and publishes if newer than last published
 * - Runs checks at `checkInterval` frequency
 *
 * 5. Circuit breaker (optional) {@link DataPackageSubscriber.enableCircuitBreaker}
 * - Allow to specify rate limits on messages received, if limit is crossed. Unsubscribing packet is sent.
 * - If fallback is enable DataPackageSubscriber will still continue working
 */
export class DataPackageSubscriber {
  logger = loggerFactory("data-packages-subscriber");
  subscribeCallback?: SubscriptionCallbackFn;
  readonly topics: string[] = [];
  readonly packagesPerTimestamp = new Map<
    number,
    Record<string, SignedDataPackage[] | undefined>
  >();
  private lastPublishedTimestamp: number = Date.now() - MAX_DELAY;
  private circuitBreaker?: RateLimitsCircuitBreaker;

  constructor(
    readonly mqttClient: Mqtt5Client,
    readonly params: DataPackageSubscriberParams
  ) {
    if (params.authorizedSigners.length < params.uniqueSignersCount) {
      throw new Error(
        `Misconfiguration authorizedSigners.length=${params.authorizedSigners.length} has to be >= uniqueSignersCount=${params.uniqueSignersCount}`
      );
    }

    if (params.minimalOffChainSignersCount < params.uniqueSignersCount) {
      throw new Error(
        `Misconfiguration uniqueSignersCount=${params.uniqueSignersCount} has to be >=  minimalOffChainSignersCount=${params.minimalOffChainSignersCount}`
      );
    }

    for (const dataPackageId of params.dataPackageIds) {
      for (const signer of params.authorizedSigners) {
        this.topics.push(
          MqttTopics.encodeDataPackageTopic({
            dataPackageId,
            dataServiceId: this.params.dataServiceId,
            nodeAddress: signer,
          })
        );
      }
    }
  }

  enableFallback(
    fallbackFn: () => Promise<DataPackagesResponse>,
    maxDelayBetweenPublishes: number,
    checkInterval: number
  ) {
    this.logger.info(
      `Enabled fallback mode interval=${checkInterval} maxDelayBetweenPublishes=${maxDelayBetweenPublishes}`
    );
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return setInterval(async () => {
      try {
        if (
          Date.now() - this.lastPublishedTimestamp >
          maxDelayBetweenPublishes
        ) {
          this.logger.warn(
            `Fallback triggered now=${Date.now()} lastPublishedTimestamp=${this.lastPublishedTimestamp}`
          );
          const dataPackages = await fallbackFn();
          const packageTimestamp =
            Object.values(dataPackages)[0]![0].dataPackage
              .timestampMilliseconds;
          this.logger.debug(
            `Received package from fallbackFn packageTimestamp=${packageTimestamp}`
          );
          if (packageTimestamp > this.lastPublishedTimestamp) {
            this.subscribeCallback!(dataPackages);
            this.lastPublishedTimestamp = packageTimestamp;
          }
        }
      } catch (e) {
        this.logger.error(
          `FallbackFn has failed error=${RedstoneCommon.stringifyError(e)}`
        );
      }
    }, checkInterval);
  }

  enableCircuitBreaker(circuitBreaker: RateLimitsCircuitBreaker) {
    this.circuitBreaker = circuitBreaker;
  }

  async subscribe(subscribeCallback: SubscriptionCallbackFn) {
    if (this.subscribeCallback) {
      this.logger.warn(
        "You tried to subscribe twice using same subscriber, aborted this action"
      );
      return;
    }
    this.subscribeCallback = subscribeCallback;

    await this.mqttClient.subscribe(
      this.topics,
      (topic, messagePayload, error) => {
        this.handleCircuitBreaker();

        try {
          if (error) {
            throw new Error(error);
          }

          this.processNewPackage(messagePayload);
        } catch (e) {
          this.logger.error(
            `Failed to process new package error=${RedstoneCommon.stringifyError(e)}`
          );
        }
      }
    );
    this.logger.info("Successfully subscribed to topics", this.topics);
  }

  private handleCircuitBreaker() {
    this.circuitBreaker?.recordEvent();
    if (this.circuitBreaker?.shouldBreakCircuit()) {
      this.logger.error("Rate limits crossed will unsubscribe from pub/sub");
      this.unsubscribe().catch((e) =>
        this.logger.error(
          `Failed to unsubscribe error=${RedstoneCommon.stringifyError(e)}`
        )
      );
    }
  }

  unsubscribe() {
    return this.mqttClient.unsubscribe(this.topics);
  }

  private processNewPackage(dataPackageFromMessage: unknown) {
    //schema
    RedstoneCommon.zodAssert<SignedDataPackagePlainObj>(
      SignedDataPackageSchema,
      dataPackageFromMessage
    );
    const signedDataPackage = SignedDataPackage.fromObj(dataPackageFromMessage);
    const packageSigner = signedDataPackage.recoverSignerAddress();

    //authorized signer
    if (!this.params.authorizedSigners.includes(packageSigner)) {
      throw new Error("Failed to verify signature");
    }

    const packageTimestamp =
      signedDataPackage.dataPackage.timestampMilliseconds;
    const dataPackageId = signedDataPackage.dataPackage.dataPackageId;

    // check if dataPackageId is in dataPackagesIds
    if (!this.params.dataPackageIds.includes(dataPackageId)) {
      throw new Error(
        `Received package with unexpected id=${dataPackageId} expectedIds=${this.params.dataPackageIds.join(",")}`
      );
    }

    //timestamp
    if (packageTimestamp <= this.lastPublishedTimestamp) {
      this.logger.debug(
        `Package was rejected because packageTimestamp=${packageTimestamp} < lastPublishedTimestamp=${this.lastPublishedTimestamp}`
      );
      return;
    }

    const entryForTimestamp =
      this.packagesPerTimestamp.get(packageTimestamp) ?? {};

    if (!entryForTimestamp[dataPackageId]) {
      entryForTimestamp[dataPackageId] = [];
    }

    if (
      entryForTimestamp[dataPackageId].some(
        (dp) => dp.recoverSignerAddress() === packageSigner
      )
    ) {
      throw new Error(
        `Package was rejected because already have package from signer=${packageSigner} for timestamp=${packageTimestamp}`
      );
    }

    this.logger.debug(
      `Received and verified data package from=${packageSigner} timestamp=${packageTimestamp} dataPackageId=${dataPackageId}`
    );

    entryForTimestamp[dataPackageId].push(signedDataPackage);

    this.packagesPerTimestamp.set(packageTimestamp, entryForTimestamp);

    if (this.canBePublishedInstantly(entryForTimestamp)) {
      this.logger.debug(
        `Got packages from all signers timestamp=${packageTimestamp}, will try to publish instantly`
      );
      return this.publish(entryForTimestamp, packageTimestamp);
    }

    if (this.canSchedulePublish(entryForTimestamp)) {
      this.logger.debug(
        `Got packages from enough authorized signers timestamp=${packageTimestamp}, will try to publish in ${this.params.waitMsForOtherSignersAfterMinimalSignersCountSatisfied}`
      );
      // this can be scheduled multiple times but this is okey, because lastPublishedTimestamp will protect from publishing multiple times
      setTimeout(
        () => this.publish(entryForTimestamp, packageTimestamp),
        this.params.waitMsForOtherSignersAfterMinimalSignersCountSatisfied
      );
    }
  }

  /** Can publish instantly only if have already packages for every data feed from every signer */
  private canBePublishedInstantly(
    entryForTimestamp: Record<string, SignedDataPackage[] | undefined>
  ) {
    return this.params.dataPackageIds.every(
      (dpId) =>
        entryForTimestamp[dpId]?.length === this.params.authorizedSigners.length
    );
  }

  /** Check if minimalOffChainSignersCount is satisfied */
  private canSchedulePublish(
    entryForTimestamp: Record<string, SignedDataPackage[] | undefined>
  ) {
    const quantifier = this.params.ignoreMissingFeeds ? "some" : "every";
    return this.params.dataPackageIds[quantifier]((dpId) => {
      if (!entryForTimestamp[dpId]) {
        return false;
      }
      return (
        entryForTimestamp[dpId].length >=
        this.params.minimalOffChainSignersCount
      );
    });
  }

  private publish(
    entryForTimestamp: Record<string, SignedDataPackage[] | undefined>,
    packageTimestamp: number
  ) {
    if (packageTimestamp > this.lastPublishedTimestamp) {
      const packagesToPublish: Record<string, SignedDataPackage[]> =
        this.preparePackagesBeforePublish(entryForTimestamp);

      this.logger.debug(
        `Publishing packages for timestamp=${packageTimestamp}`
      );

      this.subscribeCallback!(packagesToPublish);
      this.lastPublishedTimestamp = packageTimestamp;

      // clear older then last published timestamp
      this.clearOldData();
    } else {
      this.logger.debug(
        `Not publishing, because proposed packageTimestamp=${packageTimestamp} <= lastPublishedTimestamp=${this.lastPublishedTimestamp}`
      );
    }
  }

  private preparePackagesBeforePublish(
    entryForTimestamp: Record<string, SignedDataPackage[] | undefined>
  ) {
    const packagesToPublish: Record<string, SignedDataPackage[]> = {};

    for (const [dataPackageId, packages] of Object.entries(entryForTimestamp)) {
      if (
        !packages ||
        packages.length < this.params.minimalOffChainSignersCount
      ) {
        this.logger.debug(
          `Omitting dataPackageId=${dataPackageId} in published packages because not enough received=${packages ? packages.length : 0} expected=${this.params.minimalOffChainSignersCount}`
        );
        continue;
      }

      const potentialPackagesToPublish = pickDataFeedPackagesClosestToMedian(
        packages.map((dp) => dp.toObj()),
        this.params.uniqueSignersCount
      );

      if (potentialPackagesToPublish.length >= this.params.uniqueSignersCount) {
        packagesToPublish[dataPackageId] = potentialPackagesToPublish;
      }
    }
    return packagesToPublish;
  }

  private clearOldData() {
    for (const timestamp of this.packagesPerTimestamp.keys()) {
      if (timestamp <= this.lastPublishedTimestamp) {
        this.packagesPerTimestamp.delete(timestamp);
      }
    }
  }
}
