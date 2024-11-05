import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import * as awsIot from "aws-iot-device-sdk-v2";
import { randomUUID } from "crypto";
import {
  ContentTypes,
  getSerializerDeserializer,
} from "./SerializerDeserializer";

export type Mqtt5ClientConfig = {
  endpoint: string;
  authorization:
    | { type: "AWSSigV4" }
    | { type: "Cert"; privateKey: string; cert: string };
  qos?: awsIot.mqtt5.QoS;
  connectionTimeoutMs?: number;
  messageExpireTimeMs?: number;
};

const DEFAULT_CONFIG = {
  qos: awsIot.mqtt.QoS.AtMostOnce,
  connectionTimeoutMs: 10_000,
  messageExpireTimeMs: RedstoneCommon.minToMs(60),
};

const TOPICS_BATCH_LIMIT = 8;

export type MqttPayload = {
  /** valid topic @see ./topic.ts */
  topic: string;
  /** valid json object */
  data: unknown;
};

export type SubscribeCallback = (
  /** encoded topic @see ./topic.ts */
  topicName: string,
  messagePayload: unknown,
  error: string | null
) => unknown;

export class Mqtt5Client {
  private logger = loggerFactory("mqtt5-client");
  private _mqtt!: awsIot.mqtt5.Mqtt5Client;
  private config: Required<Mqtt5ClientConfig>;
  private onMessageCallback?: SubscribeCallback;

  private constructor(config: Mqtt5ClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    process.on("beforeExit", () => this.stop());
  }

  static async create(config: Mqtt5ClientConfig): Promise<Mqtt5Client> {
    const client = new Mqtt5Client(config);

    const mqttClientBuilder =
      Mqtt5Client.createMqttBuilderWithAuthorization(config);

    // Add some default configurations
    mqttClientBuilder
      .withConnectProperties({
        keepAliveIntervalSeconds: 120,
        clientId: randomUUID(),
        sessionExpiryIntervalSeconds: 3600,
      })
      .withOfflineQueueBehavior(
        awsIot.mqtt5.ClientOperationQueueBehavior.FailAllOnDisconnect
      )
      .withSessionBehavior(awsIot.mqtt5.ClientSessionBehavior.RejoinPostSuccess)
      .withRetryJitterMode(awsIot.mqtt5.RetryJitterType.Full);

    const clientConfig = mqttClientBuilder.build();

    const mqttClient = new awsIot.mqtt5.Mqtt5Client(clientConfig);

    mqttClient.start();

    mqttClient.on("error", (error) => {
      client.logger.error("error:", error);
    });

    mqttClient.on("connectionFailure", (event) => {
      client.logger.error("Connection failure:", event);
    });

    mqttClient.on("attemptingConnect", () => {
      client.logger.info("Attempting to connect...");
    });

    mqttClient.on("disconnection", (event) => {
      client.logger.error("Disconnected:", event);
    });

    client._mqtt = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        mqttClient.stop();
        reject(new Error("Connection timeout"));
      }, client.config.connectionTimeoutMs);

      mqttClient.on("connectionSuccess", () => {
        clearTimeout(timeoutId);
        client.logger.error("Connection successful");
        resolve(mqttClient);
      });
    });

    return client;
  }

  private static createMqttBuilderWithAuthorization(
    config: Mqtt5ClientConfig
  ): awsIot.iot.AwsIotMqtt5ClientConfigBuilder {
    if (config.authorization.type === "AWSSigV4") {
      const credentialsProvider =
        awsIot.auth.AwsCredentialsProvider.newDefault();

      return awsIot.iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        config.endpoint,
        {
          credentialsProvider,
        }
      );
    } else {
      return awsIot.iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromMemory(
        config.endpoint,
        config.authorization.cert,
        config.authorization.privateKey
      );
    }
  }

  /** publish all data in single batch */
  async publish(payloads: MqttPayload[], contentType: ContentTypes) {
    const promises = [];
    try {
      this._mqtt.cork();

      const serializer = getSerializerDeserializer(contentType);

      for (const payload of payloads) {
        const encodedMessage = serializer.serialize(payload.data);

        promises.push(
          this._mqtt.publish({
            payload: encodedMessage,
            topicName: payload.topic,
            qos: this.config.qos,
            contentType,
            messageExpiryIntervalSeconds: Math.floor(
              this.config.messageExpireTimeMs / 1000
            ),
          })
        );
      }
    } finally {
      this._mqtt.uncork();
    }

    await Promise.all(promises);
  }

  /** onMessage is assigned to ALL topics, you can't specify onMessage per topic*/
  async subscribe(topics: string[], onMessage: SubscribeCallback) {
    await this.subscribeToTopics(topics);
    this.onMessageCallback = onMessage;

    if (this._mqtt.listenerCount("messageReceived") === 0) {
      this._mqtt.on("messageReceived", ({ message }) => {
        const topicName = message.topicName;

        try {
          const deserializeData = getSerializerDeserializer(
            message.contentType as ContentTypes
          ).deserialize(Buffer.from(message.payload as ArrayBuffer));

          this.onMessageCallback!(message.topicName, deserializeData, null);
        } catch (e) {
          this.onMessageCallback!(
            topicName,
            null,
            `Error occurred when tried to parse message error=${RedstoneCommon.stringifyError(e)}`
          );
        }
      });
    }
  }

  /**
   * unsubscribing to not subscribed topics does NOT throw error
   */
  async unsubscribe(topics: string[]) {
    const unsubscribeResponses = [];
    for (let i = 0; i < topics.length; i += TOPICS_BATCH_LIMIT) {
      unsubscribeResponses.push(
        await this._mqtt.unsubscribe({
          topicFilters: topics.slice(i, i + TOPICS_BATCH_LIMIT),
        })
      );
    }

    if (
      unsubscribeResponses
        .flatMap((response) => response.reasonCodes)
        .some(
          (reasonCode) => reasonCode !== awsIot.mqtt5.UnsubackReasonCode.Success
        )
    ) {
      throw new Error(`Failed to unsubscribe to topics=${topics.join(", ")}`);
    }
  }

  stop() {
    this._mqtt.stop();
  }

  private async subscribeToTopics(topics: string[]) {
    for (let i = 0; i < topics.length; i += TOPICS_BATCH_LIMIT) {
      const subscriptionResult = await this._mqtt.subscribe({
        subscriptions: topics.slice(i, i + TOPICS_BATCH_LIMIT).map((topic) => ({
          topicFilter: topic,
          qos: this.config.qos,
        })),
      });

      if (
        subscriptionResult.reasonCodes.some(
          (reasonCode) => reasonCode > awsIot.mqtt5.SubackReasonCode.GrantedQoS2
        )
      ) {
        await this.unsubscribe(topics).catch((e) =>
          this.logger.error(RedstoneCommon.stringifyError(e))
        );
        throw new Error(
          `Subscription failed reason=${subscriptionResult.reasonString} reasonCodes=${subscriptionResult.reasonCodes.join(", ")}`
        );
      }
    }
  }
}
