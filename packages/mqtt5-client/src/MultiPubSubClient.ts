import { loggerFactory } from "@redstone-finance/utils";
import { Mutex } from "async-mutex";
import { SubscribeCallback } from "./Mqtt5Client";
import { PubSubClient, PubSubPayload } from "./PubSubClient";
import { ContentTypes } from "./SerializerDeserializer";

/**
 * Using subscribe and unsubscribe together in Promise.all doesn't give any performance boost cause of mutex
 */
export class MultiPubSubClient implements PubSubClient {
  clientToTopics: [PubSubClient, string[]][] = [];
  // we have to use mutex to avoid concurrent modifications of clientToTopics array
  mutex = new Mutex();
  logger = loggerFactory("multi-pub-sub-client");

  constructor(
    private readonly pubSubClientFactory: () => Promise<PubSubClient>,
    private readonly connectionsPerTopic: number
  ) {}

  publish(
    _payloads: PubSubPayload[],
    _contentType: ContentTypes
  ): Promise<void> {
    return Promise.reject(
      new Error("MultiConnectionMqtt5Client doesn't support publishing data")
    );
  }

  async subscribe(
    topics: string[],
    onMessage: SubscribeCallback
  ): Promise<void> {
    await this.mutex.acquire();
    try {
      await this._subscribe(topics, onMessage);
      this.logger.info(
        `Subscribed to ${topics.length} topics, active ${this.clientToTopics.length} connections`
      );
    } finally {
      this.mutex.release();
    }
  }

  async unsubscribe(topics: string[]): Promise<void> {
    await this.mutex.acquire();

    try {
      const updatedClientToTopics: [PubSubClient, string[]][] = [];
      for (const [client, assignedTopics] of this.clientToTopics) {
        const matchedTopics = assignedTopics.filter((t) => topics.includes(t));
        const remainingTopics = assignedTopics.filter(
          (t) => !topics.includes(t)
        );

        if (matchedTopics.length > 0) {
          await client.unsubscribe(matchedTopics);
        }

        if (remainingTopics.length > 0) {
          updatedClientToTopics.push([client, remainingTopics]);
        } else {
          client.stop();
        }
      }
      this.clientToTopics = updatedClientToTopics;
    } finally {
      this.mutex.release();
    }
  }

  stop(): void {
    for (const [client, _] of this.clientToTopics) {
      client.stop();
    }
    this.clientToTopics = [];
  }

  async _subscribe(
    topics: string[],
    onMessage: SubscribeCallback
  ): Promise<void> {
    const topicToAdd = [...topics];
    const freeClients = this.clientToTopics.filter(
      ([_, topics]) => topics.length < this.connectionsPerTopic
    );

    if (freeClients.length === 0) {
      this.clientToTopics.push([await this.pubSubClientFactory(), []]);
      return await this._subscribe(topicToAdd, onMessage);
    }

    for (const [client, subscribedTopics] of freeClients) {
      const topicsToSubscribe = topicToAdd.splice(
        0,
        this.connectionsPerTopic - subscribedTopics.length
      );

      if (topicsToSubscribe.length > 0) {
        await client.subscribe(topicsToSubscribe, onMessage);
        subscribedTopics.push(...topicsToSubscribe);
      }
    }

    if (topicToAdd.length !== 0) {
      return await this._subscribe(topicToAdd, onMessage);
    }
  }
}
