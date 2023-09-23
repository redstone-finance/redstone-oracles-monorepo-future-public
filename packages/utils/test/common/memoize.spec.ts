import { memoize } from "../../src/common/memoize";

describe("memoize", () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should cache the result within TTL", async () => {
    const mockFn: (arg: string) => Promise<string> = jest
      .fn()
      .mockResolvedValue("result");

    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const result1 = await memoized("test");
    const result2 = await memoized("test");

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe("result");
    expect(result2).toBe("result");
  });

  it("should many cache concurrent requests within TTL", async () => {
    const mockFn = jest
      .fn()
      .mockImplementation(async () => await Promise.resolve("result"));
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const requests = [];
    for (let i = 0; i < 10_000; i++) {
      requests.push(memoized());
    }

    const results = await Promise.all(requests);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 10_000; i++) {
      expect(results[i]).toBe("result");
    }
  });

  it("should not cache the result beyond TTL", async () => {
    const mockFn = jest.fn().mockResolvedValue("result");
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    await memoized("test");
    jest.advanceTimersByTime(1500); // Move time beyond TTL
    await memoized("test");

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should cache results based on argument values", async () => {
    const mockFn = jest.fn((arg: unknown) => Promise.resolve(arg));
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const result1 = await memoized("test1");
    const result2 = await memoized("test2");
    const result3 = await memoized("test1"); // Should retrieve from cache

    expect(mockFn).toHaveBeenCalledTimes(2); // Called only twice, third call retrieves from cache
    expect(result1).toBe("test1");
    expect(result2).toBe("test2");
    expect(result3).toBe("test1"); // Same as the first result
  });

  it("should distinguish between different argument sets", async () => {
    const mockFn = jest.fn((...args) => Promise.resolve(args.join(",")));
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const result1 = await memoized("arg1", "arg2");
    const result2 = await memoized("arg1");
    const result3 = await memoized("arg1", "arg2", "arg3");
    const result4 = await memoized("arg1", "arg2"); // Should retrieve from cache

    expect(mockFn).toHaveBeenCalledTimes(3); // Fourth call retrieves from cache
    expect(result1).toBe("arg1,arg2");
    expect(result2).toBe("arg1");
    expect(result3).toBe("arg1,arg2,arg3");
    expect(result4).toBe("arg1,arg2"); // Same as the first result
  });

  it("should cache results based on custom toString methods", async () => {
    const mockFn = jest.fn((obj: { name: string }) =>
      Promise.resolve(obj.name)
    );

    // Custom objects with toString method
    const obj1 = {
      name: "John",
      toString: function () {
        return this.name;
      },
    };
    const obj2 = {
      name: "Jane",
      toString: function () {
        return this.name;
      },
    };

    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });
    const result1 = await memoized(obj1);
    const result2 = await memoized(obj2);
    const result3 = await memoized(obj1); // Should retrieve from cache

    expect(mockFn).toHaveBeenCalledTimes(2); // Third call retrieves from cache
    expect(result1).toBe("John");
    expect(result2).toBe("Jane");
    expect(result3).toBe("John"); // Same as the first result
  });

  it("should not cache errors", async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error("error"));
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    await expect(memoized("test")).rejects.toThrow("error");
    mockFn.mockResolvedValue("success");
    expect(await memoized("test")).toBe("success");

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should clean up stale cache entries", async () => {
    const mockFn = jest.fn().mockResolvedValue("result");
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });
    await memoized("test1");
    jest.advanceTimersByTime(2500); // Move time beyond cleanup interval
    await memoized("test1");

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should work with long promises", async () => {
    jest.useRealTimers(); // Use real timers for this test

    const mockFn = jest.fn(
      (val: string) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve(val), 500);
        })
    );
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const result1 = await memoized("test");
    const result2 = await memoized("test");

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe("test");
    expect(result2).toBe("test");
    jest.useFakeTimers(); // Switch back to fake timers after the test
  });

  it("should many cache concurrent requests within TTL, and long promises", async () => {
    jest.useRealTimers(); // Use real timers for this test
    const mockFn = jest.fn(
      (val: string) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve(val), 500);
        })
    );
    const memoized = memoize({ functionToMemoize: mockFn, ttl: 1000 });

    const requests = [];
    for (let i = 0; i < 10_000; i++) {
      requests.push(memoized("result"));
    }

    const results = await Promise.all(requests);
    expect(mockFn).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 10_000; i++) {
      expect(results[i]).toBe("result");
    }
    jest.useFakeTimers(); // Switch back to fake timers after the test
  });

  it("different memoized functions should work independently", async () => {
    const mockFn1 = jest.fn((val: string) => Promise.resolve(`${val}-1`));
    const mockFn2 = jest.fn((val: string) => Promise.resolve(`${val}-2`));

    const memoized1 = memoize({ functionToMemoize: mockFn1, ttl: 1000 });
    const memoized2 = memoize({ functionToMemoize: mockFn2, ttl: 1000 });

    const result1a = await memoized1("test");
    const result1b = await memoized1("test");
    const result2a = await memoized2("test");
    const result2b = await memoized2("test");

    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
    expect(result1a).toBe("test-1");
    expect(result1b).toBe("test-1");
    expect(result2a).toBe("test-2");
    expect(result2b).toBe("test-2");
  });
});
