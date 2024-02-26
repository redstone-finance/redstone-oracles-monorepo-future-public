import { z } from "zod";
import { getFromEnv } from "../../src/common/env";

describe("env", () => {
  it("string", () => {
    process.env["A"] = "abc";
    const a = getFromEnv("A", z.string());
    expect(a).toBe("abc");
  });
  it("array", () => {
    process.env["A"] = "[1,2,3]";
    const a = getFromEnv("A", z.array(z.number()));
    expect(a).toEqual([1, 2, 3]);
  });
  it("number", () => {
    process.env["A"] = "123";
    const a = getFromEnv("A", z.number());
    expect(a).toBe(123);
  });
  it("wrong type", () => {
    process.env["A"] = "123";
    expect(() => getFromEnv("A", z.string())).toThrow();
  });
  it("skip JSON parse to get string", () => {
    process.env["A"] = "123";
    const a = getFromEnv("A", z.string(), false);
    expect(a).toBe("123");
  });
  it("default value", () => {
    delete process.env["A"];
    const a = getFromEnv("A", z.string().default("123"));
    expect(a).toBe("123");
  });
  it("optional value", () => {
    delete process.env["A"];
    const a = getFromEnv("A", z.string().optional());
    expect(a).toBeUndefined();
  });
  it("no schema - always returns string", () => {
    process.env["A"] = "123";
    const a = getFromEnv("A");
    expect(a).toBe("123");
  });
});
