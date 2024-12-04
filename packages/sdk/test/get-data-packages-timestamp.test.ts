import { DataPackage, NumericDataPoint } from "@redstone-finance/protocol";
import { hexZeroPad } from "ethers/lib/utils";
import { DataPackagesResponse, getDataPackagesTimestamp } from "../src";

const PK_1 = hexZeroPad("0x01", 32);
const PK_2 = hexZeroPad("0x02", 32);

const TIMESTAMP_BTC_ETH = 1729243240000;

const sutBtcEth: DataPackagesResponse = {
  BTC: [
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "BTC", value: 65000 })],
      TIMESTAMP_BTC_ETH,
      "BTC"
    ).sign(PK_1),
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "BTC", value: 64000 })],
      TIMESTAMP_BTC_ETH,
      "BTC"
    ).sign(PK_2),
  ],
  ETH: [
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "ETH", value: 2800 })],
      TIMESTAMP_BTC_ETH,
      "ETH"
    ).sign(PK_1),
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "ETH", value: 2700 })],
      TIMESTAMP_BTC_ETH,
      "ETH"
    ).sign(PK_2),
  ],
};

const TIMESTAMP_FRAXTAL = 1729243250000;

const sutFraxtal: DataPackagesResponse = {
  __FRAXTAL__: [
    new DataPackage(
      [
        new NumericDataPoint({ dataFeedId: "BTC", value: 64500 }),
        new NumericDataPoint({ dataFeedId: "ETH", value: 2650 }),
        new NumericDataPoint({ dataFeedId: "FXS", value: 1111 }),
      ],
      TIMESTAMP_FRAXTAL,
      "__MULTI_POINT__"
    ).sign(PK_1),
    new DataPackage(
      [
        new NumericDataPoint({ dataFeedId: "AAA", value: 123 }),
        new NumericDataPoint({ dataFeedId: "ETH", value: 2750 }),
        new NumericDataPoint({ dataFeedId: "FXS", value: 2222 }),
      ],
      TIMESTAMP_FRAXTAL,
      "__MULTI_POINT__"
    ).sign(PK_2),
  ],
};

describe("getDataPackagesTimestamp tests", () => {
  it("Returns the only timestamp of all packages when no feedId is passed", () => {
    const timestamp = getDataPackagesTimestamp(sutBtcEth);

    expect(timestamp).toBe(TIMESTAMP_BTC_ETH);
  });

  it("Returns the only timestamp of feedId packages when the feedId is passed", () => {
    const timestamp = getDataPackagesTimestamp(sutBtcEth, "BTC");

    expect(timestamp).toBe(TIMESTAMP_BTC_ETH);
  });

  it("Throws when wrong feedId is passed", () => {
    expect(() => getDataPackagesTimestamp(sutBtcEth, "BT")).toThrow(
      "No data packages"
    );
  });

  it("Returns the only timestamp of all medium packages when no feedId is passed", () => {
    const timestamp = getDataPackagesTimestamp(sutFraxtal);

    expect(timestamp).toBe(TIMESTAMP_FRAXTAL);
  });

  it("Returns the only timestamp of packages containing the feedId when the feedId is passed in first package", () => {
    const timestamp = getDataPackagesTimestamp(sutFraxtal, "BTC");

    expect(timestamp).toBe(TIMESTAMP_FRAXTAL);
  });

  it("Returns the only timestamp of packages containing the feedId when the feedId is passed in all packages", () => {
    const timestamp = getDataPackagesTimestamp(sutFraxtal, "ETH");

    expect(timestamp).toBe(TIMESTAMP_FRAXTAL);
  });

  it("Returns the only timestamp of packages containing the feedId when the feedId is passed in second package", () => {
    const timestamp = getDataPackagesTimestamp(sutFraxtal, "AAA");

    expect(timestamp).toBe(TIMESTAMP_FRAXTAL);
  });

  it("Throws when wrong feedId is passed", () => {
    expect(() => getDataPackagesTimestamp(sutFraxtal, "BT")).toThrow(
      "No data packages"
    );
  });

  it("Throws when timestamps are different and without feedId", () => {
    expect(() =>
      getDataPackagesTimestamp({ ...sutBtcEth, ...sutFraxtal })
    ).toThrow(/Timestamps do not have the same value/);
  });

  it("Returns when timestamps are different but not within the feed", () => {
    const timestamp = getDataPackagesTimestamp(
      { ...sutBtcEth, ...sutFraxtal },
      "BTC"
    );

    expect(timestamp).toBe(TIMESTAMP_BTC_ETH);
  });
});
