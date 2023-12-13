import { retry } from "../../src/common";

describe("retry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  // Successful Execution on First Try
  test("should succeed on first try without retrying", async () => {
    const mockFunction = jest
      .fn()
      .mockResolvedValueOnce("success") as jest.Mock<Promise<string>>;

    const result = await retry({
      fn: mockFunction,
      maxRetries: 3,
      waitBetweenMs: 1000,
    })();

    expect(result).toBe("success");
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  // Successful Execution on a Retry
  test("should succeed on third try", async () => {
    const mockFunction = jest
      .fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce("success") as jest.Mock<Promise<string>>;

    const advanceTime = jest.advanceTimersByTimeAsync(3_000);
    const result = await retry({
      fn: mockFunction,
      maxRetries: 3,
      waitBetweenMs: 1000,
    })();
    await advanceTime;

    expect(result).toBe("success");
    expect(mockFunction).toHaveBeenCalledTimes(3);
  });

  // Exceeding Maximum Retries
  test("should throw error after exceeding max retries", async () => {
    const mockFunction = jest.fn().mockRejectedValue(new Error("Failed"));

    const advanceTime = jest.advanceTimersByTimeAsync(3_000);
    await expect(
      retry({ fn: mockFunction, maxRetries: 3, waitBetweenMs: 1000 })()
    ).rejects.toThrow();
    await advanceTime;

    expect(mockFunction).toHaveBeenCalledTimes(3);
  });

  // Exponential Backoff Timing
  test("should wait correct time for exponential backoff", async () => {
    const mockFunction = jest.fn().mockRejectedValue(new Error("Failed"));

    const timePassPromise = jest.advanceTimersByTimeAsync(3000);
    await expect(
      retry({
        fn: mockFunction,
        maxRetries: 3,
        waitBetweenMs: 1000,
        backOff: { backOffBase: 2 },
      })()
    ).rejects.toThrowError();
    await timePassPromise;

    expect(mockFunction).toHaveBeenCalledTimes(3);
  });
});
