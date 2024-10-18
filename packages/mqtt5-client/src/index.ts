import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import * as awsIot from "aws-iot-device-sdk-v2";
import { randomUUID } from "node:crypto";
import {
  ContentTypes,
  getSerializerDeserializer,
} from "./SerializerDeserializer";

export type Mqtt5ClientConfig = {
  endpoint: string;
  qos?: awsIot.mqtt5.QoS;
  connectionTimeoutMs?: number;
  messageExpireTimeMs?: number;
};

const DEFAULT_CONFIG = {
  qos: awsIot.mqtt.QoS.AtLeastOnce,
  connectionTimeoutMs: 10_000,
  messageExpireTimeMs: RedstoneCommon.minToMs(60),
};

export type MqttPayload = {
  /** valid topic @see ./topic.ts */
  topic: string;
  /** valid json object */
  data: unknown;
};

export class Mqtt5Client {
  private logger = loggerFactory("mqtt5-client");
  private _mqtt!: awsIot.mqtt5.Mqtt5Client;
  private config: Required<Mqtt5ClientConfig>;

  private constructor(config: Mqtt5ClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    process.on("beforeExit", () => this.stop());
  }

  static async create(config: Mqtt5ClientConfig): Promise<Mqtt5Client> {
    const client = new Mqtt5Client(config);

    const credentialsProvider = awsIot.auth.AwsCredentialsProvider.newDefault();

    const mqttClientBuilder =
      awsIot.iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        client.config.endpoint,
        {
          credentialsProvider,
        }
      );

    // Add some default configurations
    mqttClientBuilder
      .withConnectProperties({
        keepAliveIntervalSeconds: 30,
        clientId: randomUUID(),
      })
      .withSessionBehavior(awsIot.mqtt5.ClientSessionBehavior.Clean)
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

  async subscribe(
    topics: string[],
    onMessage: (
      /** encoded topic @see ./topic.ts */
      topicName: string,
      messagePayload: unknown,
      error: string | null
    ) => unknown
  ) {
    await this._mqtt.subscribe({
      subscriptions: topics.map((topic) => ({
        topicFilter: topic,
        qos: this.config.qos,
      })),
    });

    this._mqtt.on("messageReceived", ({ message }) => {
      const topicName = message.topicName;

      try {
        const deserializeData = getSerializerDeserializer(
          message.contentType as ContentTypes
        ).deserialize(Buffer.from(message.payload as ArrayBuffer));

        onMessage(message.topicName, deserializeData, null);
      } catch (e) {
        onMessage(
          topicName,
          null,
          `Error occurred when tried to parse message error=${RedstoneCommon.stringifyError(e)}`
        );
      }
    });
  }

  async unsubscribe(topics: string[]) {
    await this._mqtt.unsubscribe({
      topicFilters: topics,
    });
  }

  stop() {
    this._mqtt.stop();
  }
}

export * as MqttTopics from "./topics";
