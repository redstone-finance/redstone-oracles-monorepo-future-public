import { jest } from "@jest/globals";
import { CronAgent, CronAgentArgs } from "../src/CronAgent";

const createMockFn = () =>
  jest.fn<() => Promise<number>>().mockResolvedValue(42);

describe("IntervalAgent", () => {
  let now: number;

  beforeEach(() => {
    now = 1000000000000;
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createAgent(partialArgs: Partial<CronAgentArgs<number>> = {}) {
    const defaultArgs: CronAgentArgs<number> = {
      job: createMockFn(),
      name: "test-agent",
      cronExpression: "*/1 * * * * *",
      maxDataTTL: 5000,
      timeout: 2000,
      ...partialArgs,
    };
    return new CronAgent(defaultArgs);
  }

  describe("start", () => {
    it("should populate cache on start", async () => {
      const agent = createAgent();
      await agent.start();
      expect(agent.getLastFreshMessageOrFail()).toBe(42);
    });

    it("should set up interval updates", async () => {
      const mockJob = createMockFn();
      const agent = createAgent({ job: mockJob });

      await agent.start();
      expect(mockJob).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(mockJob).toHaveBeenCalledTimes(2);
    });
  });

  describe("stop", () => {
    it("should clear interval on stop", async () => {
      const mockJob = createMockFn();
      const agent = createAgent({ job: mockJob });

      await agent.start();
      agent.stop();

      jest.advanceTimersByTime(2000);
      expect(mockJob).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe("getCachedData", () => {
    it("should throw error when data is stale", async () => {
      const agent = createAgent({ maxDataTTL: 1000 });
      await agent.start();

      jest.advanceTimersByTime(1500);

      expect(() => agent.getLastFreshMessageOrFail()).toThrow(
        /Cached data is stale/
      );
    });

    it("should return cached value when not stale", async () => {
      const agent = createAgent();
      await agent.start();

      jest.advanceTimersByTime(500);
      expect(agent.getLastFreshMessageOrFail()).toBe(42);
    });
  });

  describe("error handling", () => {
    it("should handle job failures", async () => {
      const mockJob = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve(42))
        .mockImplementationOnce(() => Promise.resolve(43))
        .mockImplementationOnce(() => Promise.reject(new Error("error")))
        .mockImplementation(() => Promise.resolve(45));

      const agent = createAgent({ job: mockJob as () => Promise<number> });

      const mockError = jest.spyOn(agent.logger, "warn");
      await agent.start();

      await jest.advanceTimersByTimeAsync(5_000);

      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Agent job failed")
      );

      expect(agent.getLastFreshMessageOrFail()).toEqual(45);
    });
  });

  describe("concurrent updates", () => {
    it("should skip update if previous is still in progress", async () => {
      const mockJob = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve(10))
        .mockImplementationOnce(() =>
          Promise.all([
            agent["executeJobAndSaveResults"](),
            new Promise((r) => setTimeout(r, 2000)),
          ])
        )
        .mockImplementation(() => Promise.resolve(10));

      const agent = createAgent({ job: mockJob as () => Promise<number> });
      await agent.start();

      // Try to trigger another update while first is in progress
      await jest.advanceTimersByTimeAsync(2500);

      expect(mockJob).toHaveBeenCalledTimes(2);
    });
  });
});
