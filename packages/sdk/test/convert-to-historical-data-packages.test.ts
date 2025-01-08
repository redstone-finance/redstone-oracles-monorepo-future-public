import { afterEach } from "node:test";
import {
  convertToHistoricalDataPackagesRequestParams,
  HISTORICAL_DATA_PACKAGES_DENOMINATOR_MS,
} from "../src";

describe("convertToHistoricalDataPackagesRequestParams", () => {
  const MOCK_TIME = 1732431947000;
  const EXPECTED_HISTORICAL_TIME = 1732431930000;
  const PREVIOUS_HISTORICAL_TIME =
    EXPECTED_HISTORICAL_TIME - HISTORICAL_DATA_PACKAGES_DENOMINATOR_MS;

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
      historicalTimestamp: EXPECTED_HISTORICAL_TIME,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should adjust historicalTimestamp if it is equal to latestDataPackagesTimestamp", () => {
    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      mockRelayerConfig,
      EXPECTED_HISTORICAL_TIME
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: PREVIOUS_HISTORICAL_TIME,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should adjust historicalTimestamp if it is equal to latestDataPackagesTimestamp and fallback offset is less than historical packages granulation", () => {
    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      { ...mockRelayerConfig, fallbackOffsetInMilliseconds: 8000 },
      EXPECTED_HISTORICAL_TIME
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: PREVIOUS_HISTORICAL_TIME,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should return requestParams with historicalTimestamp and urls if valid config is provided for given base timestamp", () => {
    jest.useRealTimers();

    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      mockRelayerConfig,
      undefined,
      MOCK_TIME
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: EXPECTED_HISTORICAL_TIME,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });

  it("should adjust historicalTimestamp if it is equal to latestDataPackagesTimestamp and fallback offset is less than historical packages granulation for given base timestamp", () => {
    jest.useRealTimers();

    const result = convertToHistoricalDataPackagesRequestParams(
      mockRequestParams,
      { ...mockRelayerConfig, fallbackOffsetInMilliseconds: 8000 },
      EXPECTED_HISTORICAL_TIME,
      MOCK_TIME
    );

    expect(result).toEqual({
      ...mockRequestParams,
      historicalTimestamp: PREVIOUS_HISTORICAL_TIME,
      urls: mockRelayerConfig.historicalPackagesGateways,
    });
  });
});
