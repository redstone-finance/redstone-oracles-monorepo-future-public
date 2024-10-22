import { DataPackage, NumericDataPoint } from "@redstone-finance/protocol";
import { hexZeroPad } from "ethers/lib/utils";
import { chooseDataPackagesTimestamp, DataPackagesResponse } from "../src";

const PK_1 = hexZeroPad("0x01", 32);
const PK_2 = hexZeroPad("0x02", 32);

const TEST_TS_BTC_MAX = 1729243240000;
const TEST_TS_BTC_MIN = 1729243230000;
const TEST_TS_ETH_MAX = 1729243220000;
const TEST_TS_ETH_MIN = 1729243210000;

const sutBtcEth = {
  BTC: [
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "BTC", value: 65000 })],
      TEST_TS_BTC_MAX,
      "BTC"
    ).sign(PK_1),
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "BTC", value: 64000 })],
      TEST_TS_BTC_MIN,
      "BTC"
    ).sign(PK_2),
  ],
  ETH: [
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "ETH", value: 2800 })],
      TEST_TS_ETH_MAX,
      "ETH"
    ).sign(PK_1),
    new DataPackage(
      [new NumericDataPoint({ dataFeedId: "ETH", value: 2700 })],
      TEST_TS_ETH_MIN,
      "ETH"
    ).sign(PK_2),
  ],
};

const TEST_TS_FRAX_MAX = 1729244500000;
const TEST_TS_FRAX_MIN = 1729244490000;

const sutFraxtal: DataPackagesResponse = {
  __FRAXTAL__: [
    new DataPackage(
      [
        new NumericDataPoint({ dataFeedId: "BTC", value: 64500 }),
        new NumericDataPoint({ dataFeedId: "ETH", value: 2650 }),
        new NumericDataPoint({ dataFeedId: "FXS", value: 1111 }),
      ],
      TEST_TS_FRAX_MAX,
      "__MULTI_POINT__"
    ).sign(PK_1),
    new DataPackage(
      [
        new NumericDataPoint({ dataFeedId: "AAA", value: 123 }),
        new NumericDataPoint({ dataFeedId: "ETH", value: 2750 }),
        new NumericDataPoint({ dataFeedId: "FXS", value: 2222 }),
      ],
      TEST_TS_FRAX_MIN,
      "__MULTI_POINT__"
    ).sign(PK_2),
  ],
};

describe("chooseDataPackagesTimestamp tests", () => {
  it("Returns min timestamp of all packages when no feedId is passed", () => {
    const timestamp = chooseDataPackagesTimestamp(sutBtcEth);

    expect(timestamp).toBe(TEST_TS_ETH_MIN);
  });

  it("Returns min timestamp of feedId packages when the feedId is passed", () => {
    const timestamp = chooseDataPackagesTimestamp(sutBtcEth, "BTC");

    expect(timestamp).toBe(TEST_TS_BTC_MIN);
  });

  it("Throws when wrong feedId is passed", () => {
    expect(() => chooseDataPackagesTimestamp(sutBtcEth, "BT")).toThrow(
      "Data packages are missing! (feedId BT)"
    );
  });

  it("Returns min timestamp of all medium packages when no feedId is passed", () => {
    const timestamp = chooseDataPackagesTimestamp(sutFraxtal);

    expect(timestamp).toBe(TEST_TS_FRAX_MIN);
  });

  it("Returns min timestamp of packages containing the feedId when the feedId is passed in first package", () => {
    const timestamp = chooseDataPackagesTimestamp(sutFraxtal, "BTC");

    expect(timestamp).toBe(TEST_TS_FRAX_MAX);
  });

  it("Returns min timestamp of packages containing the feedId when the feedId is passed in all packages", () => {
    const timestamp = chooseDataPackagesTimestamp(sutFraxtal, "ETH");

    expect(timestamp).toBe(TEST_TS_FRAX_MIN);
  });

  it("Returns min timestamp of packages containing the feedId when the feedId is passed in second package", () => {
    const timestamp = chooseDataPackagesTimestamp(sutFraxtal, "AAA");

    expect(timestamp).toBe(TEST_TS_FRAX_MIN);
  });

  it("Throws when wrong feedId is passed", () => {
    expect(() => chooseDataPackagesTimestamp(sutFraxtal, "BT")).toThrow(
      "Data packages are missing! (feedId BT)"
    );
  });
});
