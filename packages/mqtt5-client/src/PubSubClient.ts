import { SubscribeCallback } from "./Mqtt5Client";
import { ContentTypes } from "./SerializerDeserializer";

export type PubSubPayload = {
  /** valid topic @see ./topic.ts */
  topic: string;
  /** valid json object */
  data: unknown;
};

export interface PubSubClient {
  /**
   * Publishes multiple payloads in a single batch
   * @param payloads Array of topic and data pairs to publish
   * @param contentType The content type of the messages
   */
  publish(payloads: PubSubPayload[], contentType: ContentTypes): Promise<void>;

  /**
   * Subscribes to multiple topics and handles incoming messages
   * @param topics Array of topics to subscribe to
   * @param onMessage Callback function for handling received messages
   */
  subscribe(topics: string[], onMessage: SubscribeCallback): Promise<void>;

  /**
   * Unsubscribes from specified topics
   * @param topics Array of topics to unsubscribe from
   */
  unsubscribe(topics: string[]): Promise<void>;

  stop(): void;
}
