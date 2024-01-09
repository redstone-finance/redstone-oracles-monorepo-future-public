import { consts } from "@redstone-finance/protocol";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import {
  DATA_PACKAGE_DATA_1,
  DATA_PACKAGE_DATA_2,
  createTesterContractEnv,
} from "./helpers/test_helpers";
import { TonUnitTesterContractAdapter } from "./unit_tester/TonUnitTesterContractAdapter";
import { TonUnitTesterContractDeployer } from "./unit_tester/TonUnitTesterContractDeployer";

describe("TON unit Tests", () => {
  let testerAdapter: TonUnitTesterContractAdapter;

  beforeAll(async () => {
    const { network, testerCode } = await createTesterContractEnv("unit_tests");

    testerAdapter = await new TonUnitTesterContractDeployer(
      network,
      testerCode
    ).getAdapter();
  });

  it("recover signer address 1c", async () => {
    expect(
      await testerAdapter.testGetDataPackageSignerAddress(
        DATA_PACKAGE_DATA_1,
        "333ecb944d5fc5de0dd6eb264ed2134cfb5e9b5db4933d9bfbdb15c4e71f70b729b1be6f047d78691cd459268213e294b4d66c544e9953b88f9f0bfb2c77159b1c"
      )
    ).toBe("0x12470f7aBA85c8b81D63137DD5925D6EE114952b".toLowerCase());
  });

  it("recover signer address 1b", async () => {
    expect(
      await testerAdapter.testGetDataPackageSignerAddress(
        DATA_PACKAGE_DATA_2,
        "18d7684f83d8fe57447c5e23c14ada832b6567484c02117ab9294b909b0435450531c01b9882b91983032cc18504820008d798e95e1b3a68c79a11b346994a921b"
      )
    ).toBe("0x1eA62d73EdF8AC05DfceA1A34b9796E937a29EfF".toLowerCase());
  });

  it("median for sorted arrays", async () => {
    for await (const caseData of [
      { numbers: [1, 3, 7], expectedMedian: 3 },
      { numbers: [1, 7], expectedMedian: 4 },
      { numbers: [1, 7, 7], expectedMedian: 7 },
      { numbers: [1, 7, 7, 7], expectedMedian: 7 },
      {
        numbers: [15],
        expectedMedian: 15,
      },
    ]) {
      expect(await testerAdapter.testMedian(caseData.numbers)).toBe(
        caseData.expectedMedian
      );
    }
  });

  it("median for unsorted arrays", async () => {
    for await (const caseData of [
      { numbers: [7, 1, 3], expectedMedian: 3 },
      { numbers: [3, 1, 7], expectedMedian: 3 },
      { numbers: [3, 1, 7, 12], expectedMedian: 5 },
      { numbers: [12, 3, 1, 7], expectedMedian: 5 },
      { numbers: [7, 1], expectedMedian: 4 },
    ]) {
      expect(await testerAdapter.testMedian(caseData.numbers)).toBe(
        caseData.expectedMedian
      );
    }
  });

  it("median for empty array should reject", () => {
    void expect(testerAdapter.testMedian([])).rejects.toHaveProperty(
      "exitCode",
      999
    );
  });

  it("slice unsigned integer from string", async () => {
    const { remainingSlice, value: dataPointCount } =
      await testerAdapter.testSliceUint(
        DATA_PACKAGE_DATA_1,
        consts.DATA_POINTS_COUNT_BS
      );

    expect(dataPointCount).toBe(1n);

    const { remainingSlice: slice2, value: valueByteSize } =
      await testerAdapter.testSliceUint(
        remainingSlice,
        consts.DATA_POINT_VALUE_BYTE_SIZE_BS
      );

    expect(valueByteSize).toBe(32n);

    const { remainingSlice: slice3, value: timestamp } =
      await testerAdapter.testSliceUint(slice2, consts.TIMESTAMP_BS);

    expect(timestamp).toBe(1678113550000n);

    const { remainingSlice: slice4, value: price } =
      await testerAdapter.testSliceUint(slice3, 32);

    expect(price).toBe(156954083908n);
    expect(slice4.bits.length).toBe(consts.DATA_FEED_ID_BS * 8);
  });

  it("slice signed integer from string", async () => {
    const { remainingSlice, value } = await testerAdapter.testSliceInt(
      "0x12470f7aBA85c8b81D63137DD5925D6EE114952b",
      160
    );

    expect(value).toBe(104346535230593580204614826068498408664160572715n);
    expect(remainingSlice.bits.length).toBe(0);
  });

  it("slice integers from string for extreme lengths", async () => {
    void expect(
      testerAdapter.testSliceInt(DATA_PACKAGE_DATA_1, 258)
    ).rejects.toHaveProperty("exitCode", 997);

    void expect(
      testerAdapter.testSliceUint(DATA_PACKAGE_DATA_1, 33)
    ).rejects.toHaveProperty("exitCode", 997);

    void expect(testerAdapter.testSliceUint("", 1)).rejects.toHaveProperty(
      "exitCode",
      9
    );

    const { remainingSlice, value } = await testerAdapter.testSliceInt(
      DATA_PACKAGE_DATA_1,
      0
    );

    expect(value).toBe(0n);
    expect(remainingSlice.bits.length).toBe(
      (DATA_PACKAGE_DATA_1.length / 2) * 8
    );
  });

  it("deserialize integers passed as a serialized tuple", async () => {
    for await (const caseData of [
      [],
      [1, 2, 3],
      ["BTC", "ETH", "USDT"].map((n) => hexlify(toUtf8Bytes(n))),
      ["0x12470f7aBA85c8b81D63137DD5925D6EE114952b"],
      ["0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"],
      [
        "0x12470f7aBA85c8b81D63137DD5925D6EE114952b",
        1,
        hexlify(toUtf8Bytes("BTC")),
      ],
      Array.from(Array(255).keys()),
    ]) {
      expect(
        await testerAdapter.testTupleDeserializeIntegers(caseData)
      ).toStrictEqual(caseData.map(BigInt));
    }
    void expect(
      testerAdapter.testTupleDeserializeIntegers(Array.from(Array(256).keys()))
    ).rejects.toHaveProperty("exitCode", 997);
  });
});
