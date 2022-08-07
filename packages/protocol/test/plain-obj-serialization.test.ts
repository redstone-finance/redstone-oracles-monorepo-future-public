import { toUtf8Bytes } from "ethers/lib/utils";
import {
  DataPackage,
  SignedDataPackage,
  NumericDataPoint,
  DataPoint,
  INumericDataPoint,
  StringDataPoint,
} from "../src";
import { deserializeDataPointFromObj } from "../src/data-point/data-point-deserializer";

const TIMESTAMP_FOR_TESTS = 1654353400000;
const PRIVATE_KEY_FOR_TESTS_1 =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

const prepareSignedDataPackageForTests = (
  dataPoints: DataPoint[]
): SignedDataPackage => {
  const dataPackage = new DataPackage(dataPoints, TIMESTAMP_FOR_TESTS);
  return dataPackage.sign(PRIVATE_KEY_FOR_TESTS_1);
};

const testSerializationAndDeserializationOfNumericDataPoint = (
  dataPointArgs: INumericDataPoint
) => {
  const dataPoint = new NumericDataPoint(dataPointArgs);
  const plainObj = dataPoint.toObj();
  expect(plainObj).toEqual(dataPointArgs);
  const deserializedDataPoint = deserializeDataPointFromObj(
    JSON.parse(JSON.stringify(plainObj))
  );
  expect(deserializedDataPoint.toBytesHex()).toBe(dataPoint.toBytesHex());
};

describe("Fixed size data package", () => {
  test("Should correctly serialize and deserialize a standard numeric data point", () => {
    testSerializationAndDeserializationOfNumericDataPoint({
      dataFeedId: "TEST",
      value: 42,
    });
  });

  test("Should correctly serialize and deserialize a numeric data point with a custom value byte size", () => {
    testSerializationAndDeserializationOfNumericDataPoint({
      dataFeedId: "TEST",
      value: 42,
      valueByteSize: 10,
    });
  });

  test("Should correctly serialize and deserialize a numeric data point with a custom decimals", () => {
    testSerializationAndDeserializationOfNumericDataPoint({
      dataFeedId: "TEST",
      value: 42,
      decimals: 20,
    });
  });

  test("Should correctly serialize and deserialize a custom numeric data point", () => {
    testSerializationAndDeserializationOfNumericDataPoint({
      dataFeedId: "TEST",
      value: 42,
      decimals: 10,
      valueByteSize: 28,
    });
  });

  test("Should correctly serialize and deserialize a string data point", () => {
    const dataPoint = new StringDataPoint({
      dataFeedId: "TEST",
      value: "Some random string value hehehe",
    });
    const plainObj = dataPoint.toObj();
    expect(plainObj).toEqual({
      dataFeedId: "TEST",
      value: "U29tZSByYW5kb20gc3RyaW5nIHZhbHVlIGhlaGVoZQ==",
    });
    const deserializedDataPoint = deserializeDataPointFromObj(
      JSON.parse(JSON.stringify(plainObj))
    );
    expect(deserializedDataPoint.toBytesHex()).toBe(dataPoint.toBytesHex());
  });

  test("Should correctly serialize signed standard numeric data package", () => {
    const dataPoints = [
      { dataFeedId: "BTC", value: 20000 },
      { dataFeedId: "ETH", value: 1000 },
    ];
    const signedDataPackage = prepareSignedDataPackageForTests(
      dataPoints.map((dp) => new NumericDataPoint(dp))
    );
    const serializedPlainObj = signedDataPackage.toObj();
    expect(serializedPlainObj).toEqual({
      dataPoints,
      timestampMilliseconds: TIMESTAMP_FOR_TESTS,
      signature:
        "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    });
    const deserializedSignedDataPackage = SignedDataPackage.fromObj(
      JSON.parse(JSON.stringify(serializedPlainObj))
    ).toBytesHex();
    expect(deserializedSignedDataPackage).toBe(signedDataPackage.toBytesHex());
  });

  test("Should correctly serialize signed data package with mixed values", () => {
    const dataPoints: DataPoint[] = [];
    dataPoints.push(new NumericDataPoint({ dataFeedId: "ETH", value: 1000 }));
    dataPoints.push(
      new NumericDataPoint({
        dataFeedId: "PRECISE-BTC",
        value: 20000,
        decimals: 18,
      })
    );
    dataPoints.push(
      new StringDataPoint({
        dataFeedId: "SOME-STRING",
        value: "qwertyuiopasdfghjklzxcvbnmqwerty",
      })
    );
    dataPoints.push(
      new DataPoint(
        "SOME-BYTES",
        toUtf8Bytes("qwertyuiopasdfghjklzxcvbnmqwerty")
      )
    );

    const signedDataPackage = prepareSignedDataPackageForTests(dataPoints);
    const serializedPlainObj = signedDataPackage.toObj();
    expect(serializedPlainObj).toEqual({
      dataPoints: [
        { dataFeedId: "ETH", value: 1000 },
        { dataFeedId: "PRECISE-BTC", value: 20000, decimals: 18 },
        {
          dataFeedId: "SOME-BYTES",
          value: "cXdlcnR5dWlvcGFzZGZnaGprbHp4Y3Zibm1xd2VydHk=",
        },
        {
          dataFeedId: "SOME-STRING",
          value: "cXdlcnR5dWlvcGFzZGZnaGprbHp4Y3Zibm1xd2VydHk=",
        },
      ],
      timestampMilliseconds: TIMESTAMP_FOR_TESTS,
      signature:
        "WJ+EFIe6pSwzCRcjKWIYMWyhmtKJP+tN2aI55+Ip5w4osIGH0ngUEjTO4b7sAPBGd5MIv11qbPaFxWReppbGDRs=",
    });
    const deserializedSignedDataPackage = SignedDataPackage.fromObj(
      JSON.parse(JSON.stringify(serializedPlainObj))
    ).toBytesHex();
    expect(deserializedSignedDataPackage).toBe(signedDataPackage.toBytesHex());
  });
});
