import { RateLimitsCircuitBreaker } from "../src/RateLimitsCircuitBreaker";

describe("rate limit circuit breaker", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it("should record event", () => {
    const circuitBreaker = new RateLimitsCircuitBreaker(100, 100);
    circuitBreaker.recordEvent();

    expect(circuitBreaker.events).toEqual([Date.now()]);
  });

  it("shouldBreakCircuit", () => {
    const circuitBreaker = new RateLimitsCircuitBreaker(100, 2);

    for (let i = 0; i < 3; i++) {
      circuitBreaker.recordEvent();
    }

    expect(circuitBreaker.shouldBreakCircuit()).toEqual(true);

    jest.advanceTimersByTime(101);
    expect(circuitBreaker.shouldBreakCircuit()).toEqual(false);
    expect(circuitBreaker.events.length).toEqual(0);

    for (let i = 0; i < 2; i++) {
      circuitBreaker.recordEvent();
    }

    expect(circuitBreaker.shouldBreakCircuit()).toEqual(false);
  });
});
