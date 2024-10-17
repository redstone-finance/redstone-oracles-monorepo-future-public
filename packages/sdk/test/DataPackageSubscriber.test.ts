import {
  Mqtt5Client,
  MqttPayload,
  MqttTopics,
} from "@redstone-finance/mqtt5-client";
import {
  DataPackage,
  NumericDataPoint,
  SignedDataPackage,
} from "@redstone-finance/protocol";
import { RedstoneLogger } from "@redstone-finance/utils";
import { ethers } from "ethers";
import _ from "lodash";
import {
  DataPackageSubscriber,
  DataPackageSubscriberParams,
} from "../src/DataPackageSubscriber";
import { RateLimitsCircuitBreaker } from "../src/RateLimitsCircuitBreaker";

const MOCK_WALLET_1 = new ethers.Wallet(
  "0xfae81e7c122f2ad245be182d88889e6a037bbeebd7de7bb5ca10f891d359e440"
);
const MOCK_WALLET_2 = new ethers.Wallet(
  "0x0a566b182e650472efe9a17efb850cc01bb5e479add24739942ba43327a194f9"
);
const MOCK_WALLET_3 = new ethers.Wallet(
  "0xd56e1ee933657d6bcdec81f9956392aef47a7f8b1a1275b6e4ad551fb5d6b14c"
);
const MOCK_WALLET_4 = new ethers.Wallet(
  "0x0926c41d4b99ce1a7b713f14bc553975ee1de28311a94f10ccedec7d9c35c329"
);
const MOCK_WALLET_5 = new ethers.Wallet(
  "0x7712474356ae40814b45e9317579388d5e185ac17177f0399831f29141c7c896"
);

const dataServiceId = "data-service-1";

type SubscribeFn = (
  topicName: string,
  messagePayload: unknown,
  error: string | null
) => unknown;

class MockMqttClient {
  topicToCallback: Map<string, SubscribeFn> = new Map();

  subscribe(topics: string[], onMessage: SubscribeFn) {
    for (const topic of topics) {
      this.topicToCallback.set(topic, onMessage);
    }
  }

  publish(payloads: MqttPayload[]) {
    for (const payload of payloads) {
      this.topicToCallback.get(payload.topic)?.(
        payload.topic,
        payload.data,
        null
      );
    }
  }

  unsubscribe() {
    this.topicToCallback.clear();
    return Promise.resolve();
  }
}

function createDataPackage(
  dataPackageId: string,
  value: number,
  timestamp: number,
  signer: ethers.Wallet
): SignedDataPackage {
  const dataPackage = new DataPackage(
    [
      new NumericDataPoint({
        dataFeedId: dataPackageId,
        value,
      }),
    ],
    timestamp,
    dataPackageId
  );

  return dataPackage.sign(signer.privateKey);
}

async function publishToMqtt(
  mqtt: Mqtt5Client,
  packageData: {
    signer: ethers.Wallet;
    value: number;
    timestamp: number;
    dataPackageId: string;
  }
) {
  const dataPackage = createDataPackage(
    packageData.dataPackageId,
    packageData.value,
    packageData.timestamp,
    packageData.signer
  );
  await mqtt.publish(
    [
      {
        topic: MqttTopics.encodeDataPackageTopic({
          dataServiceId,
          dataPackageId: dataPackage.dataPackage.dataPackageId,
          nodeAddress: MOCK_WALLET_1.address,
        }),
        data: dataPackage.toObj(),
      },
    ],
    "deflate+json"
  );

  return dataPackage;
}

function createMockParams(override: Partial<DataPackageSubscriberParams>) {
  return {
    dataServiceId,
    dataPackageIds: ["ETH"],
    authorizedSigners: [MOCK_WALLET_1.address, MOCK_WALLET_2.address],
    uniqueSignersCount: 2,
    minimalOffChainSignersCount: 2,
    ignoreMissingFeeds: false,
    waitMsForOtherSignersAfterMinimalSignersCountSatisfied: 100,
    ...override,
  };
}

function createMockMqttClient(): Mqtt5Client {
  return new MockMqttClient() as unknown as Mqtt5Client;
}

async function singleSignerSetUp() {
  const mqtt = createMockMqttClient();
  const subscriber = new DataPackageSubscriber(
    mqtt,
    createMockParams({
      dataPackageIds: ["ETH"],
      authorizedSigners: [MOCK_WALLET_1.address],
      uniqueSignersCount: 1,
      minimalOffChainSignersCount: 1,
    })
  );

  const logger = jest.fn();
  const loggerDebug = jest.fn();
  subscriber.logger = {
    error: logger,
    info: () => {},
    warn: () => {},
    debug: loggerDebug,
  } as unknown as RedstoneLogger;

  const callback = jest.fn();
  await subscriber.subscribe(callback);
  return { mqtt, callback, logger, subscriber, loggerDebug };
}

describe("subscribe-data-packages", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("config validation", () => {
    it("should throw error when signers length < unique signers count", () => {
      const mqtt = createMockMqttClient();

      expect(
        () =>
          new DataPackageSubscriber(
            mqtt,
            createMockParams({
              uniqueSignersCount: 2,
              authorizedSigners: [MOCK_WALLET_3.address],
            })
          )
      ).toThrowError(/Misconfiguration authorizedSigners/);
    });

    it("should throw offChainMinimalSignersCount < uniqueSignersCount", () => {
      const mqtt = createMockMqttClient();

      expect(
        () =>
          new DataPackageSubscriber(
            mqtt,
            createMockParams({
              uniqueSignersCount: 2,
              minimalOffChainSignersCount: 1,
              authorizedSigners: [MOCK_WALLET_3.address, MOCK_WALLET_1.address],
            })
          )
      ).toThrowError(/Misconfiguration uniqueSignersCount/);
    });
  });

  describe("topics", () => {
    it("should subscribe to valid topics", async () => {
      const mqtt = createMockMqttClient();
      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({ dataPackageIds: ["ETH"] })
      );
      await subscriber.subscribe(() => {});

      expect(subscriber.topics).toEqual([
        `data-package/data-service-1/ETH/${MOCK_WALLET_1.address}`,
        `data-package/data-service-1/ETH/${MOCK_WALLET_2.address}`,
      ]);
      expect([
        ...(mqtt as unknown as MockMqttClient).topicToCallback.keys(),
      ]).toEqual(subscriber.topics);
    });

    it("should subscribe to even more topics", async () => {
      const mqtt = createMockMqttClient();
      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({ dataPackageIds: ["ETH", "ETH+", "BTC"] })
      );
      await subscriber.subscribe(() => {});

      expect(subscriber.topics).toEqual([
        `data-package/data-service-1/ETH/${MOCK_WALLET_1.address}`,
        `data-package/data-service-1/ETH/${MOCK_WALLET_2.address}`,
        `data-package/data-service-1/ETH+/${MOCK_WALLET_1.address}`,
        `data-package/data-service-1/ETH+/${MOCK_WALLET_2.address}`,
        `data-package/data-service-1/BTC/${MOCK_WALLET_1.address}`,
        `data-package/data-service-1/BTC/${MOCK_WALLET_2.address}`,
      ]);

      expect([
        ...(mqtt as unknown as MockMqttClient).topicToCallback.keys(),
      ]).toEqual(subscriber.topics);
    });

    it("should subscribe to all data feeds, when more then 50 data feeds", async () => {
      const mqtt = createMockMqttClient();
      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: _.range(0, 100).map((x) => x.toString()),
        })
      );
      await subscriber.subscribe(() => {});

      expect(subscriber.topics).toEqual([
        `data-package/data-service-1/+/${MOCK_WALLET_1.address}`,
        `data-package/data-service-1/+/${MOCK_WALLET_2.address}`,
      ]);

      expect([
        ...(mqtt as unknown as MockMqttClient).topicToCallback.keys(),
      ]).toEqual(subscriber.topics);
    });
  });

  describe("single package validation", () => {
    it("should aggregate prices for single data feed id, one signer", async () => {
      const { mqtt, callback } = await singleSignerSetUp();

      const dataPackage = createDataPackage(
        "ETH",
        12,
        Date.now(),
        MOCK_WALLET_1
      );

      await mqtt.publish(
        [
          {
            topic: MqttTopics.encodeDataPackageTopic({
              dataServiceId,
              dataPackageId: "ETH",
              nodeAddress: MOCK_WALLET_1.address,
            }),
            data: dataPackage.toObj(),
          },
        ],
        "deflate+json"
      );

      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith({
        ETH: [dataPackage],
      });
    });

    it("should reject package not fulfilling schema", async () => {
      const { mqtt, callback, logger } = await singleSignerSetUp();
      const dataPackage = createDataPackage(
        "ETH",
        12,
        Date.now(),
        MOCK_WALLET_1
      );

      await mqtt.publish(
        [
          {
            topic: MqttTopics.encodeDataPackageTopic({
              dataServiceId,
              dataPackageId: "ETH",
              nodeAddress: MOCK_WALLET_1.address,
            }),
            data: { ...dataPackage.toObj(), timestampMilliseconds: "abc" },
          },
        ],
        "deflate+json"
      );

      expect(callback).toBeCalledTimes(0);
      expect(logger).toBeCalledWith(
        expect.stringContaining("Zod validation error")
      );
    });

    it("should reject package wrong signer", async () => {
      const { mqtt, callback, logger } = await singleSignerSetUp();
      const dataPackage = createDataPackage(
        "ETH",
        12,
        Date.now(),
        MOCK_WALLET_2
      );

      await mqtt.publish(
        [
          {
            topic: MqttTopics.encodeDataPackageTopic({
              dataServiceId,
              dataPackageId: "ETH",
              nodeAddress: MOCK_WALLET_1.address,
            }),
            data: dataPackage.toObj(),
          },
        ],
        "deflate+json"
      );

      expect(callback).toBeCalledTimes(0);
      expect(logger).toBeCalledWith(
        expect.stringContaining("Failed to verify signature")
      );
    });

    it("should reject package if it is older or the same timestamp as last published", async () => {
      const { mqtt, callback, loggerDebug, subscriber } =
        await singleSignerSetUp();

      const timestamp = Date.now();

      // first call to setup packageTimestamp
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp,
        signer: MOCK_WALLET_1,
      });

      expect(callback).toBeCalledTimes(1);
      subscriber.params.authorizedSigners.push(MOCK_WALLET_2.address);

      // the same
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp,
        signer: MOCK_WALLET_2,
      });

      jest.runAllTimers();
      expect(callback).toBeCalledTimes(1);
      expect(loggerDebug).toBeCalledWith(
        expect.stringContaining("Package was rejected because packageTimestamp")
      );

      // older
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: timestamp - 1,
        signer: MOCK_WALLET_2,
      });

      jest.runAllTimers();
      expect(callback).toBeCalledTimes(1);
      expect(loggerDebug).toBeCalledWith(
        expect.stringContaining("Package was rejected because packageTimestamp")
      );
    });

    it("should reject package from duplicated signer", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH"],
          authorizedSigners: [MOCK_WALLET_1.address, MOCK_WALLET_2.address],
          uniqueSignersCount: 2,
        })
      );
      const callback = jest.fn();
      await subscriber.subscribe(callback);
      const logger = jest.fn();
      subscriber.logger = {
        error: logger,
        debug: () => {},
      } as unknown as RedstoneLogger;

      const timestamp = Date.now();
      // first call to setup packageTimestamp
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: timestamp,
        signer: MOCK_WALLET_1,
      });

      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 13,
        timestamp: timestamp,
        signer: MOCK_WALLET_1,
      });

      expect(callback).toBeCalledTimes(0);
      expect(logger).toBeCalledWith(
        expect.stringContaining(
          `Package was rejected because already have package from signer=${MOCK_WALLET_1.address}`
        )
      );
    });

    it("should reject package if id not in requested dataPackageId", async () => {
      const { mqtt, callback, logger } = await singleSignerSetUp();
      const dataPackage = createDataPackage(
        "ETH2",
        12,
        Date.now(),
        MOCK_WALLET_1
      );

      // first call to setup packageTimestamp
      await mqtt.publish(
        [
          {
            topic: MqttTopics.encodeDataPackageTopic({
              dataServiceId,
              dataPackageId: "ETH",
              nodeAddress: MOCK_WALLET_1.address,
            }),
            data: dataPackage.toObj(),
          },
        ],
        "deflate+json"
      );

      expect(callback).toBeCalledTimes(0);
      expect(logger).toBeCalledWith(
        expect.stringContaining("Received package with unexpected id=ETH2")
      );
    });

    it("should remove old data", async () => {
      const { mqtt, callback, subscriber } = await singleSignerSetUp();

      const dataPackage = await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: Date.now(),
        signer: MOCK_WALLET_1,
      });

      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith({
        ETH: [dataPackage],
      });

      expect([...subscriber.packagesPerTimestamp.keys()].length).toEqual(0);
    });
  });

  describe("publish requirements", () => {
    it("should instantly  publish data when received data from all signers", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH"],
          authorizedSigners: [MOCK_WALLET_1.address, MOCK_WALLET_2.address],
          uniqueSignersCount: 1,
          minimalOffChainSignersCount: 2,
        })
      );
      const callback = jest.fn();
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      // first call to setup packageTimestamp
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 11,
        timestamp: packageTimestamp,
        signer: MOCK_WALLET_1,
      });

      // doesn't publish cause still only one signer
      jest.runAllTimers();
      expect(callback).toBeCalledTimes(0);

      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: packageTimestamp,
        signer: MOCK_WALLET_2,
      });

      jest.runAllTimers();
      expect(callback).toBeCalledTimes(1);
    });

    it("should publish after delay when received data from minimalOffChainSignersCount", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH"],
          authorizedSigners: [MOCK_WALLET_1.address, MOCK_WALLET_2.address],
          uniqueSignersCount: 1,
          minimalOffChainSignersCount: 1,
        })
      );
      const callback = jest.fn();
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      // first call to setup packageTimestamp
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: packageTimestamp,
        signer: MOCK_WALLET_1,
      });

      // doesn't publish cause still only one signer
      jest.advanceTimersByTime(
        subscriber.params
          .waitMsForOtherSignersAfterMinimalSignersCountSatisfied + 1
      );
      expect(callback).toBeCalledTimes(1);
    });

    it("should publish even one feed of two required when ignoreMissingFeeds enabled and minimalOffChainSignersCount satisfied", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH", "BTC"],
          authorizedSigners: [MOCK_WALLET_1.address, MOCK_WALLET_2.address],
          uniqueSignersCount: 2,
          minimalOffChainSignersCount: 2,
          ignoreMissingFeeds: true,
        })
      );
      const callback = jest.fn();
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      const firstPackage = await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 12,
        timestamp: packageTimestamp,
        signer: MOCK_WALLET_1,
      });

      jest.runAllTimers();
      expect(callback).toBeCalledTimes(0);

      const secondPackage = await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 13,
        timestamp: packageTimestamp,
        signer: MOCK_WALLET_2,
      });

      expect(callback).toBeCalledTimes(0);

      jest.advanceTimersByTime(
        subscriber.params
          .waitMsForOtherSignersAfterMinimalSignersCountSatisfied + 1
      );
      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith({
        ETH: [firstPackage, secondPackage],
      });
    });
  });

  describe("production like situations", () => {
    const NODES = [
      MOCK_WALLET_1,
      MOCK_WALLET_2,
      MOCK_WALLET_3,
      MOCK_WALLET_4,
      MOCK_WALLET_5,
    ];
    it("should prices closest to median and slice at unique signer threshold", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH", "BTC"],
          authorizedSigners: NODES.map((n) => n.address),
          uniqueSignersCount: 2,
          minimalOffChainSignersCount: 2,
          ignoreMissingFeeds: true,
        })
      );
      const callback = jest.fn();
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      let valueEth = 1;
      let valueBtc = 1;
      const publishedPackagesEth = [];
      const publishedPackagesBtc = [];
      for (const node of NODES) {
        publishedPackagesEth.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "ETH",
            value: valueEth++,
            timestamp: packageTimestamp,
            signer: node,
          })
        );

        publishedPackagesBtc.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "BTC",
            value: valueBtc++,
            timestamp: packageTimestamp,
            signer: node,
          })
        );
      }

      expect(callback).toBeCalledWith({
        ETH: [publishedPackagesEth[2], publishedPackagesEth[1]],
        BTC: [publishedPackagesBtc[2], publishedPackagesBtc[1]],
      });
    });

    it("4 nodes produces value, 1 node lags 2 seconds", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH"],
          authorizedSigners: NODES.map((n) => n.address),
          uniqueSignersCount: 2,
          minimalOffChainSignersCount: 4,
          ignoreMissingFeeds: true,
        })
      );
      let callbackCalledAt = 0;
      const callback = jest
        .fn()
        .mockImplementationOnce(() => (callbackCalledAt = Date.now()));
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      let valueEth = 1;
      const publishedPackagesEth = [];
      for (const node of NODES.slice(0, 4)) {
        publishedPackagesEth.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "ETH",
            value: valueEth++,
            timestamp: packageTimestamp,
            signer: node,
          })
        );
      }

      jest.advanceTimersByTime(2_000);
      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: valueEth,
        timestamp: packageTimestamp,
        signer: NODES[4],
      });

      expect(callback).toBeCalledWith({
        ETH: [publishedPackagesEth[1], publishedPackagesEth[2]],
      });
      expect(Date.now() - callbackCalledAt).toEqual(
        2_000 -
          subscriber.params
            .waitMsForOtherSignersAfterMinimalSignersCountSatisfied
      );
    });

    it("4 nodes produces value, 1 node never publishes", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH"],
          authorizedSigners: NODES.map((n) => n.address),
          uniqueSignersCount: 2,
          minimalOffChainSignersCount: 4,
          ignoreMissingFeeds: true,
        })
      );
      let callbackCalledAt = 0;
      const callback = jest
        .fn()
        .mockImplementationOnce(() => (callbackCalledAt = Date.now()));
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      let valueEth = 1;
      const publishedPackagesEth = [];
      for (const node of NODES.slice(0, 4)) {
        publishedPackagesEth.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "ETH",
            value: valueEth++,
            timestamp: packageTimestamp,
            signer: node,
          })
        );
      }

      jest.advanceTimersByTime(2_000);

      expect(callback).toBeCalledWith({
        ETH: [publishedPackagesEth[1], publishedPackagesEth[2]],
      });
      expect(Date.now() - callbackCalledAt).toEqual(
        2_000 -
          subscriber.params
            .waitMsForOtherSignersAfterMinimalSignersCountSatisfied
      );
    });

    it("5 nodes produces value for BTC, 3 for ETH, 2 for DAI, 1 for USDT", async () => {
      const mqtt = createMockMqttClient();

      const subscriber = new DataPackageSubscriber(
        mqtt,
        createMockParams({
          dataPackageIds: ["ETH", "BTC", "USDT", "DAI"],
          authorizedSigners: NODES.map((n) => n.address),
          uniqueSignersCount: 2,
          minimalOffChainSignersCount: 3,
          ignoreMissingFeeds: true,
        })
      );
      let callbackCalledAt = 0;
      const callback = jest
        .fn()
        .mockImplementation(() => (callbackCalledAt = Date.now()));
      await subscriber.subscribe(callback);
      const packageTimestamp = Date.now();

      let value = 1;
      const publishedPackagesBtc = [];
      for (const node of NODES.slice(0, 2)) {
        await publishToMqtt(mqtt, {
          dataPackageId: "DAI",
          value: (value *= 2),
          timestamp: packageTimestamp,
          signer: node,
        });
      }

      for (const node of NODES.slice(0, 1)) {
        await publishToMqtt(mqtt, {
          dataPackageId: "USDT",
          value: (value *= 2),
          timestamp: packageTimestamp,
          signer: node,
        });
      }

      for (const node of NODES) {
        publishedPackagesBtc.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "BTC",
            value: (value *= 2),
            timestamp: packageTimestamp,
            signer: node,
          })
        );
      }

      const publishedPackagesEth = [];
      for (const node of NODES.slice(0, 3)) {
        publishedPackagesEth.push(
          await publishToMqtt(mqtt, {
            dataPackageId: "ETH",
            value: (value *= 2),
            timestamp: packageTimestamp,
            signer: node,
          })
        );
      }

      jest.advanceTimersByTime(
        200 +
          subscriber.params
            .waitMsForOtherSignersAfterMinimalSignersCountSatisfied
      );

      expect(callback).toBeCalledWith({
        BTC: [publishedPackagesBtc[2], publishedPackagesBtc[1]],
        ETH: [publishedPackagesEth[1], publishedPackagesEth[0]],
      });
      expect(Date.now() - callbackCalledAt).toEqual(200);
    });
  });

  describe("fallback mode", () => {
    it("fallback mode should be triggered after maxDelayerBetweenPublishes", async () => {
      jest.setTimeout(15_000);
      const { callback, mqtt, subscriber } = await singleSignerSetUp();

      const fallbackPackage = createDataPackage(
        "ETH",
        3,
        Date.now() + 2_000,
        MOCK_WALLET_1
      );
      const fallbackFn = jest.fn().mockImplementationOnce(() => ({
        ETH: [fallbackPackage],
      }));
      const interval = subscriber.enableFallback(fallbackFn, 1_000, 200);

      await publishToMqtt(mqtt, {
        signer: MOCK_WALLET_1,
        value: 2,
        timestamp: Date.now(),
        dataPackageId: "ETH",
      });

      expect(callback).toBeCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1_200);
      clearInterval(interval);

      expect(fallbackFn).toBeCalledTimes(1);
      expect(callback).toBeCalledTimes(2);
      expect(callback).toBeCalledWith({ ETH: [fallbackPackage] });
    });

    it("fallback mode should NOT be triggered if maxDelayerBetweenPublishes doesn't pass", async () => {
      jest.setTimeout(15_000);
      const { callback, mqtt, subscriber } = await singleSignerSetUp();

      const fallbackFn = jest.fn().mockImplementationOnce(() => ({
        ETH: [createDataPackage("ETH", 3, Date.now() + 2_000, MOCK_WALLET_1)],
      }));
      const interval = subscriber.enableFallback(fallbackFn, 1_500, 200);

      await publishToMqtt(mqtt, {
        signer: MOCK_WALLET_1,
        value: 2,
        timestamp: Date.now(),
        dataPackageId: "ETH",
      });

      expect(callback).toBeCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1_200);
      clearInterval(interval);

      expect(fallbackFn).toBeCalledTimes(0);
      expect(callback).toBeCalledTimes(1);
    });
  });

  describe("circuit breaker", () => {
    it("should trigger circuit breaker and unsubscribe", async () => {
      const { subscriber, mqtt } = await singleSignerSetUp();

      subscriber.enableCircuitBreaker(new RateLimitsCircuitBreaker(1000, 2));
      const unsubSpy = jest.spyOn(subscriber, "unsubscribe");

      expect(unsubSpy).toBeCalledTimes(0);

      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 1,
        timestamp: Date.now() + 1,
        signer: MOCK_WALLET_1,
      });
      expect(unsubSpy).toBeCalledTimes(0);

      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 1,
        timestamp: Date.now() + 2,
        signer: MOCK_WALLET_1,
      });
      expect(unsubSpy).toBeCalledTimes(0);

      await publishToMqtt(mqtt, {
        dataPackageId: "ETH",
        value: 1,
        timestamp: Date.now() + 3,
        signer: MOCK_WALLET_1,
      });
      expect(unsubSpy).toBeCalledTimes(1);
    });
  });
});
