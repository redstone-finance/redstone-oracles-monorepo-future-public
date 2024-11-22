import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import {
  DataPackagesResponse,
  pickDataFeedPackagesClosestToMedian,
  SignedDataPackageSchema,
} from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { LastPublishedFeedState } from "./LastPublishedFeedState";
import { MultiPubSubClient } from "./MultiPubSubClient";
import { RateLimitsCircuitBreaker } from "./RateLimitsCircuitBreaker";
import { encodeDataPackageTopic } from "./topics";

const MAX_DELAY = RedstoneCommon.minToMs(2);

/**
 * defines behavior of {@link DataPackageSubscriber}
 */
export type DataPackageSubscriberParams = {
  /**
   * for production environment most of the time "redstone-primary-prod" is appropriate
   */
  dataServiceId: string;
  /**
   * array of tokens to fetch. If more then 50, then we subscribe to all. Because of message broker limits.
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
 * - NEVER publish a package with the same timestamp or older than the last published - this rule is enforced per DATA PACKAGE ID
 * - ALWAYS packages published together have same timestamp
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
  private lastPublishedState: LastPublishedFeedState;
  private circuitBreaker?: RateLimitsCircuitBreaker;
  fallbackInterval?: NodeJS.Timeout;

  constructor(
    readonly pubSubClient: MultiPubSubClient,
    readonly params: DataPackageSubscriberParams
  ) {
    if (params.authorizedSigners.length === 0) {
      throw new Error("You have to provide at least one authorized signer");
    }

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

    this.lastPublishedState = new LastPublishedFeedState(
      params.dataPackageIds,
      Date.now() - MAX_DELAY
    );

    for (const dataPackageId of params.dataPackageIds) {
      for (const signer of params.authorizedSigners) {
        this.topics.push(
          encodeDataPackageTopic({
            dataPackageId,
            dataServiceId: this.params.dataServiceId,
            nodeAddress: signer,
          })
        );
      }
    }
  }

  /** Packages returned by fallbackFn are not verified - use {@link requestDataPackages} for off-chain verification */
  enableFallback(
    fallbackFn: () => Promise<DataPackagesResponse>,
    maxDelayBetweenPublishes: number,
    checkInterval: number
  ) {
    this.logger.info(
      `Enabled fallback mode interval=${checkInterval} maxDelayBetweenPublishes=${maxDelayBetweenPublishes}`
    );
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.fallbackInterval = setInterval(async () => {
      try {
        if (
          this.lastPublishedState.isAnyFeedNotPublishedIn(
            maxDelayBetweenPublishes
          )
        ) {
          this.logger.warn(
            `Fallback triggered now=${Date.now()} lastPublishedTimestamp=${this.lastPublishedState.toString()}`
          );
          const dataPackages = await fallbackFn();
          const packageTimestamp =
            Object.values(dataPackages)[0]![0].dataPackage
              .timestampMilliseconds;

          this.logger.debug(
            `Received package from fallbackFn packageTimestamp=${packageTimestamp}`
          );

          const newerPackagesOnly =
            this.lastPublishedState.filterOutNotNewerPackages(dataPackages);

          const newDataPackagesIds = Object.keys(newerPackagesOnly);

          if (newDataPackagesIds.length > 0) {
            this.logger.info(
              `Publishing packages from fallback method timestamp=${packageTimestamp} latency=${Date.now() - packageTimestamp} dataPackageIds=${newDataPackagesIds.join(",")}`
            );
            this.subscribeCallback!(dataPackages);
            this.lastPublishedState.update(
              Object.keys(newerPackagesOnly),
              packageTimestamp
            );
          }
        }
      } catch (e) {
        this.logger.error(
          `FallbackFn has failed error=${RedstoneCommon.stringifyError(e)}`
        );
      }
    }, checkInterval);
  }

  disableFallback() {
    clearInterval(this.fallbackInterval);
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

    try {
      await this.pubSubClient.subscribe(
        this.topics,
        (_, messagePayload, error) => {
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
    } catch (e) {
      if (this.fallbackInterval) {
        this.logger.warn(
          "Failed to subscribe to topics, continuing because fallback is enabled"
        );
        return;
      } else {
        throw e;
      }
    }
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
    return this.pubSubClient.unsubscribe(this.topics);
  }

  stop() {
    this.pubSubClient.stop();
  }

  private processNewPackage(dataPackageFromMessage: unknown) {
    //schema
    RedstoneCommon.zodAssert<SignedDataPackagePlainObj>(
      SignedDataPackageSchema,
      dataPackageFromMessage
    );
    const signedDataPackage = SignedDataPackage.fromObj(dataPackageFromMessage);
    const dataPackageId = signedDataPackage.dataPackage.dataPackageId;
    const packageTimestamp =
      signedDataPackage.dataPackage.timestampMilliseconds;

    // check if dataPackageId is in dataPackagesIds
    // reject before signature checking to save CPU cycles
    if (!this.params.dataPackageIds.includes(dataPackageId)) {
      this.logger.debug(
        `Received package with unexpected id=${dataPackageId} expectedIds=${this.params.dataPackageIds.join(",")}`
      );
      return;
    }

    const packageSigner = signedDataPackage.recoverSignerAddress();

    //authorized signer
    if (!this.params.authorizedSigners.includes(packageSigner)) {
      throw new Error(
        `Failed to verify signature signer=${packageSigner} expectedSigners=${this.params.authorizedSigners.join(",")} dataPackageId=${dataPackageId} packageTimestamp=${packageTimestamp}`
      );
    }

    //timestamp
    if (
      !this.lastPublishedState.isNewerThanLastPublished(
        dataPackageId,
        packageTimestamp
      )
    ) {
      this.logger.debug(
        `Package was rejected because packageTimestamp=${packageTimestamp} <= lastPublishedTimestamp=${this.lastPublishedState.getLastPublishTime(dataPackageId)}`
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
      this.logger.debug(
        `Package was rejected because already have package signer=${packageSigner} timestamp=${packageTimestamp} dataPackageId=${dataPackageId}`
      );
      return;
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
        `Got packages from enough authorized signers timestamp=${packageTimestamp}, will try to publish in ${this.params.waitMsForOtherSignersAfterMinimalSignersCountSatisfied} [ms]`
      );
      // this can be scheduled multiple times, but this is okay, because lastPublishedTimestamp will protect from publishing multiple times
      setTimeout(
        () => this.publish(entryForTimestamp, packageTimestamp),
        this.params.waitMsForOtherSignersAfterMinimalSignersCountSatisfied
      );
    }
  }

  /** Can publish instantly only if already have packages for every data feed from every signer */
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
    const packagesToPublish: DataPackagesResponse =
      this.preparePackagesBeforePublish(entryForTimestamp);

    const packageIdsToPublish = Object.keys(packagesToPublish);

    if (packageIdsToPublish.length === 0) {
      return;
    }

    this.logger.info(
      `Publishing packages timestamp=${packageTimestamp} latency=${Date.now() - packageTimestamp} dataPackageIds=${packageIdsToPublish.join(",")}`
    );

    if (!this.subscribeCallback) {
      return this.logger.warn(
        `subscribeCallback is undefined - have already unsubscribed?`
      );
    }

    this.subscribeCallback(packagesToPublish);
    this.lastPublishedState.update(
      Object.keys(packagesToPublish),
      packageTimestamp
    );

    this.cleanPublishedAndStalePackages(packageTimestamp);
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
    return this.lastPublishedState.filterOutNotNewerPackages(packagesToPublish);
  }

  private cleanPublishedAndStalePackages(timestamp: number) {
    const entryForTimestamp = this.packagesPerTimestamp.get(timestamp)!;

    const onlyNewerPackages =
      this.lastPublishedState.filterOutNotNewerPackages(entryForTimestamp);

    this.packagesPerTimestamp.set(timestamp, onlyNewerPackages);

    const now = Date.now();
    // extra clear for packages which were never published
    for (const timestamp of this.packagesPerTimestamp.keys()) {
      if (timestamp <= now - MAX_DELAY) {
        this.packagesPerTimestamp.delete(timestamp);
      }
    }
  }
}
