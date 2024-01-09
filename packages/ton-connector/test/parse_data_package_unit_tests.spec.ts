import { consts } from "@redstone-finance/protocol";
import {
  createTesterContractEnv,
  DATA_PACKAGE_DATA_1,
  DATA_PACKAGE_DATA_2,
  ETH_BIG_NUMBER,
  SAMPLE_PACKAGES_TIMESTAMP,
  TON_MAX_UINT,
} from "./helpers/test_helpers";
import { TonUnitTesterContractAdapter } from "./unit_tester/TonUnitTesterContractAdapter";
import { TonUnitTesterContractDeployer } from "./unit_tester/TonUnitTesterContractDeployer";

const DATA_PACKAGE_VALUES_LENGTH =
  consts.DATA_FEED_ID_BS + consts.DEFAULT_NUM_VALUE_BS + consts.TIMESTAMP_BS;

describe("TON parse data package Unit Tests", () => {
  let testerAdapter: TonUnitTesterContractAdapter;

  beforeAll(async () => {
    const { network, testerCode } = await createTesterContractEnv("unit_tests");

    testerAdapter = await new TonUnitTesterContractDeployer(
      network,
      testerCode
    ).getAdapter();
  });

  it("parse data package", async () => {
    const { feedId, value, timestamp } =
      await testerAdapter.testParseDataPackage(DATA_PACKAGE_DATA_1);

    expect(feedId).toBe(ETH_BIG_NUMBER);
    expect(value).toBe(156954083908n);
    expect(timestamp).toBe((SAMPLE_PACKAGES_TIMESTAMP + 10) * 1000);

    const {
      feedId: feedId2,
      value: value2,
      timestamp: timestamp2,
    } = await testerAdapter.testParseDataPackage(DATA_PACKAGE_DATA_2);

    expect(feedId2).toBe(ETH_BIG_NUMBER);
    expect(value2).toBe(156970916060n);
    expect(timestamp2).toBe(SAMPLE_PACKAGES_TIMESTAMP * 1000);
  });

  it("parse data package for extreme data", async () => {
    const extremeDataPackage =
      "ff".repeat(DATA_PACKAGE_VALUES_LENGTH) + "00000020000001";
    const {
      feedId: feedIdExtreme,
      value: valuExtreme,
      timestamp: timestampExtreme,
    } = await testerAdapter.testParseDataPackage(extremeDataPackage);

    expect(feedIdExtreme).toBe(TON_MAX_UINT);
    expect(valuExtreme).toBe(TON_MAX_UINT);
    expect(timestampExtreme).toBe(281474976710655);
  });

  it("parse data package for zero data", async () => {
    const zeroDataPackage =
      "00".repeat(DATA_PACKAGE_VALUES_LENGTH) + "00000020000001";
    const {
      feedId: feedIdExtreme,
      value: valuExtreme,
      timestamp: timestampExtreme,
    } = await testerAdapter.testParseDataPackage(zeroDataPackage);

    expect(feedIdExtreme).toBe(0n);
    expect(valuExtreme).toBe(0n);
    expect(timestampExtreme).toBe(0);
  });

  it("parse data package should fail for wrong data", () => {
    void expect(
      testerAdapter.testParseDataPackage("00" + DATA_PACKAGE_DATA_1)
    ).rejects.toHaveProperty("exitCode", 9);

    void expect(testerAdapter.testParseDataPackage("")).rejects.toHaveProperty(
      "exitCode",
      9
    );

    const zeroDataPackage =
      "00".repeat(DATA_PACKAGE_VALUES_LENGTH) + "00000000000001";

    void expect(
      testerAdapter.testParseDataPackage(zeroDataPackage)
    ).rejects.toHaveProperty("exitCode", 600);

    void expect(
      testerAdapter.testParseDataPackage(
        DATA_PACKAGE_DATA_1.substring(0, DATA_PACKAGE_DATA_1.length - 2) + "00"
      )
    ).rejects.toHaveProperty("exitCode", 600);
  });
});
