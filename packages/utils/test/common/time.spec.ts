import { RedstoneCommon } from "../../src";

const LONGER_DURATION_MS = 60;
const NORMAL_DURATION_MS = 50;
const FUNCTION_VALUE = 5;
const CUSTOM_ERROR_MESSAGE = "Custom error message";

describe("timeout", () => {
  const asyncFunction = (duration: number) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(FUNCTION_VALUE);
      }, duration)
    );
  };

  it("should return the function value when asyncFunction is not timed out", async () => {
    expect(
      await RedstoneCommon.timeout(
        asyncFunction(NORMAL_DURATION_MS),
        LONGER_DURATION_MS
      )
    ).toEqual(FUNCTION_VALUE);
  });

  it("should return the function value when asyncFunction is not timed out with custom error message", async () => {
    expect(
      await RedstoneCommon.timeout(
        asyncFunction(NORMAL_DURATION_MS),
        LONGER_DURATION_MS,
        CUSTOM_ERROR_MESSAGE
      )
    ).toEqual(FUNCTION_VALUE);
  });

  it("should throw default error when asyncFunction is timed out", async () => {
    await expect(
      RedstoneCommon.timeout(
        asyncFunction(LONGER_DURATION_MS),
        NORMAL_DURATION_MS
      )
    ).rejects.toThrow("Timeout error 50 [MS]");
  });

  it("should throw custom-message error when asyncFunction is not timed out with custom error message", async () => {
    await expect(
      RedstoneCommon.timeout(
        asyncFunction(LONGER_DURATION_MS),
        NORMAL_DURATION_MS,
        CUSTOM_ERROR_MESSAGE
      )
    ).rejects.toThrow("Custom error message");
  });

  it("should return the custom value value when asyncFunction is timed out with custom timeout callback", async () => {
    expect(
      await RedstoneCommon.timeout(
        asyncFunction(LONGER_DURATION_MS),
        NORMAL_DURATION_MS,
        CUSTOM_ERROR_MESSAGE,
        (resolve, _reject) => {
          resolve(333);
        }
      )
    ).toEqual(333);
  });

  it("should throw the custom-reject error value when asyncFunction is timed out with custom timeout callback", async () => {
    await expect(
      RedstoneCommon.timeout(
        asyncFunction(LONGER_DURATION_MS),
        NORMAL_DURATION_MS,
        undefined,
        (_resolve, reject) => {
          reject(new Error("Custom reject"));
        }
      )
    ).rejects.toThrow("Custom reject");
  });
});
