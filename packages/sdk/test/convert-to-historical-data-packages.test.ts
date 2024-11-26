import { afterEach } from "node:test";
import { convertToHistoricalDataPackagesRequestParams } from "../src";

describe("convertToHistoricalDataPackagesRequestParams", () => {
  const MOCK_TIME = 1732431947000;

  const mockRequestParams = {
    dataServiceId: "test-service",
    dataPackagesIds: ["id1", "id2"],
    uniqueSignersCount: 2,
  };

  const mockRelayerConfig = {
    fallbackOffsetInMilliseconds: 15000,
    historicalPackagesGateways: [
      "https://gateway1.com",
      "https://gateway2.com",
    ],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(MOCK_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throw an error if fallbackOffsetInMilliseconds is not configured", () => {
    expect(() =>
      convertToHistoricalDataPackagesRequestParams(mockRequestParams, {
        ...mockRelayerConfig,
        fallbackOffsetInMilliseconds: 0,
      })
    ).toThrow(
      "Historical packages fetcher for fallback deviation check is not properly configured"
    );
  });

  it("should throw an error if historicalPackagesGateways is not configured", () => {
    expect(() =>
      convertToHistoricalDataPackagesRequestParams(mockRequestParams, {
        ...mockRelayerConfig,
        historicalPackagesGateways: undefined,
      })
    ).toThrow(
      "Historical packages fetcher for fallback deviation check is not properly configured"
    );
  });

  it("should throw an error if historicalPackagesGateways is not an array or is empty", () => {
    expect(() =>
      convertToHistoricalDataPackagesRequestParams(mockRequestParams, {
        ...mockRelayerConfig,
        historicalPackagesGateways: [],
      })
    ).toThrow(
      "Historical packages fetcher for fallback deviation check is not properly configured"
    );
  });

  it("should return requestParams with historicalTimestamp and urls if valid config is provided", () => {
    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      mockRelayerConfig
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: 1732431930000,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should adjust historicalTimestamp if it is equal to latestDataPackagesTimestamp", () => {
    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      mockRelayerConfig,
      1732431930000
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: 1732431920000,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should adjust historicalTimestamp if it is equal to latestDataPackagesTimestamp and fallback offset is less than historical packages granulation", () => {
    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      { ...mockRelayerConfig, fallbackOffsetInMilliseconds: 8000 },
      1732431930000
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: 1732431920000,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });
});
