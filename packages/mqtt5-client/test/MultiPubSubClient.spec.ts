/* eslint-disable @typescript-eslint/unbound-method */
import { MultiPubSubClient } from "../src/MultiPubSubClient";
import { PubSubClient } from "../src/PubSubClient";

describe("MultiPubSubClient", () => {
  let mockClient: PubSubClient;
  let fabric: jest.Mock;
  let client: MultiPubSubClient;

  beforeEach(() => {
    mockClient = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      stop: jest.fn(),
    };
    fabric = jest.fn().mockResolvedValue(mockClient);
    client = new MultiPubSubClient(fabric, 2); // 2 topics per connection
  });

  it("should throw error on publish", async () => {
    await expect(() =>
      client.publish([{ topic: "test", data: {} }], "deflate+json")
    ).rejects.toThrow(
      "MultiConnectionMqtt5Client doesn't support publishing data"
    );
  });

  describe("subscribe", () => {
    const onMessage = jest.fn();

    it("should create new client when no clients exist", async () => {
      await client.subscribe(["topic1"], onMessage);

      expect(fabric).toHaveBeenCalledTimes(1);
      expect(mockClient.subscribe).toHaveBeenCalledWith(["topic1"], onMessage);
      expect(client.clientToTopics).toHaveLength(1);
      expect(client.clientToTopics[0][1]).toEqual(["topic1"]);
    });

    it("should distribute topics across multiple clients", async () => {
      await client.subscribe(["topic1", "topic2", "topic3"], onMessage);

      expect(fabric).toHaveBeenCalledTimes(2);
      expect(client.clientToTopics).toHaveLength(2);
      expect(client.clientToTopics[0][1]).toEqual(["topic1", "topic2"]);
      expect(client.clientToTopics[1][1]).toEqual(["topic3"]);
    });

    it("should use existing client if it has capacity", async () => {
      await client.subscribe(["topic1"], onMessage);
      await client.subscribe(["topic2"], onMessage);

      expect(fabric).toHaveBeenCalledTimes(1);
      expect(client.clientToTopics).toHaveLength(1);
      expect(client.clientToTopics[0][1]).toEqual(["topic1", "topic2"]);
    });
  });

  describe("unsubscribe", () => {
    const onMessage = jest.fn();

    beforeEach(async () => {
      await client.subscribe(["topic1", "topic2", "topic3"], onMessage);
    });

    it("should unsubscribe topics from clients", async () => {
      await client.unsubscribe(["topic1", "topic2"]);

      expect(mockClient.unsubscribe).toHaveBeenCalledWith(["topic1", "topic2"]);
      expect(client.clientToTopics[0][1]).toEqual(["topic3"]);
    });

    it("should stop and remove client when all its topics are unsubscribed", async () => {
      await client.unsubscribe(["topic1", "topic2", "topic3"]);

      expect(mockClient.stop).toHaveBeenCalledTimes(2);
      expect(client.clientToTopics).toHaveLength(0);
    });
  });

  describe("stop", () => {
    it("should stop all clients", async () => {
      const onMessage = jest.fn();
      await client.subscribe(["topic1", "topic2", "topic3"], onMessage);

      client.stop();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockClient.stop).toHaveBeenCalledTimes(2);
      expect(client.clientToTopics).toHaveLength(0);
    });
  });
});

describe("MultiPubSubClient complex", () => {
  let mockClient1: PubSubClient;
  let mockClient2: PubSubClient;
  let clientIndex = 0;
  let fabric: jest.Mock;
  let client: MultiPubSubClient;
  const onMessage = jest.fn();

  beforeEach(() => {
    clientIndex = 0;
    mockClient1 = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      stop: jest.fn(),
    };
    mockClient2 = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      stop: jest.fn(),
    };

    fabric = jest.fn().mockImplementation(() => {
      return Promise.resolve(clientIndex++ === 0 ? mockClient1 : mockClient2);
    });

    client = new MultiPubSubClient(fabric, 2); // 2 topics per connection
  });

  it("should handle subscribe -> unsubscribe -> subscribe sequence", async () => {
    // Initial subscribe
    await client.subscribe(["topic1", "topic2"], onMessage);
    expect(fabric).toHaveBeenCalledTimes(1);
    expect(mockClient1.subscribe).toHaveBeenCalledWith(
      ["topic1", "topic2"],
      onMessage
    );
    expect(client.clientToTopics).toHaveLength(1);
    expect(client.clientToTopics[0][1]).toEqual(["topic1", "topic2"]);

    // Unsubscribe one topic
    await client.unsubscribe(["topic1"]);
    expect(mockClient1.unsubscribe).toHaveBeenCalledWith(["topic1"]);
    expect(client.clientToTopics[0][1]).toEqual(["topic2"]);

    // Subscribe new topic
    await client.subscribe(["topic3"], onMessage);
    expect(mockClient1.subscribe).toHaveBeenCalledWith(["topic3"], onMessage);
    expect(client.clientToTopics[0][1]).toEqual(["topic2", "topic3"]);
  });

  it("should handle multiple clients lifecycle", async () => {
    // Subscribe to topics that require two clients
    await client.subscribe(["topic1", "topic2", "topic3", "topic4"], onMessage);

    expect(fabric).toHaveBeenCalledTimes(2);
    expect(mockClient1.subscribe).toHaveBeenCalledWith(
      ["topic1", "topic2"],
      onMessage
    );
    expect(mockClient2.subscribe).toHaveBeenCalledWith(
      ["topic3", "topic4"],
      onMessage
    );
    expect(client.clientToTopics).toHaveLength(2);

    // Unsubscribe from all topics of first client
    await client.unsubscribe(["topic1", "topic2"]);
    expect(mockClient1.unsubscribe).toHaveBeenCalledWith(["topic1", "topic2"]);
    expect(mockClient1.stop).toHaveBeenCalledTimes(1);
    expect(client.clientToTopics).toHaveLength(1);

    // Subscribe new topics
    await client.subscribe(["topic5", "topic6"], onMessage);
    expect(fabric).toHaveBeenCalledTimes(3);
    expect(client.clientToTopics).toHaveLength(2);
  });

  it("should handle concurrent subscribe operations", async () => {
    // Start multiple subscribe operations simultaneously
    const promises = [
      client.subscribe(["topic1", "topic2"], onMessage),
      client.subscribe(["topic3", "topic4"], onMessage),
      client.subscribe(["topic5", "topic6"], onMessage),
    ];

    await Promise.all(promises);

    expect(fabric).toHaveBeenCalledTimes(3);
    expect(client.clientToTopics).toHaveLength(3);

    // Verify mutex prevented race conditions
    const allTopics = client.clientToTopics.flatMap(([_, topics]) => topics);
    expect(allTopics).toHaveLength(6);
    expect(new Set(allTopics).size).toBe(6); // No duplicate topics
  });

  it("should handle subscribe -> unsubscribe -> stop sequence", async () => {
    // Initial subscriptions
    await client.subscribe(["topic1", "topic2"], onMessage);
    await client.subscribe(["topic3", "topic4"], onMessage);

    expect(client.clientToTopics).toHaveLength(2);

    // Partial unsubscribe
    await client.unsubscribe(["topic1", "topic3"]);
    expect(client.clientToTopics[0][1]).toEqual(["topic2"]);
    expect(client.clientToTopics[1][1]).toEqual(["topic4"]);

    // Stop everything
    client.stop();
    expect(mockClient1.stop).toHaveBeenCalled();
    expect(mockClient2.stop).toHaveBeenCalled();
    expect(client.clientToTopics).toHaveLength(0);
  });

  it("should handle resubscribe to previously unsubscribed topics", async () => {
    // Initial subscribe
    await client.subscribe(["topic1", "topic2"], onMessage);
    expect(client.clientToTopics).toHaveLength(1);
    expect(fabric).toHaveBeenCalledTimes(1);

    // Unsubscribe all
    await client.unsubscribe(["topic1", "topic2"]);
    expect(client.clientToTopics).toHaveLength(0);

    // Resubscribe to same topics
    await client.subscribe(["topic1", "topic2"], onMessage);
    expect(fabric).toHaveBeenCalledTimes(2); // New client created
    expect(client.clientToTopics).toHaveLength(1);
    expect(client.clientToTopics[0][1]).toEqual(["topic1", "topic2"]);
  });
});
