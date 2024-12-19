import { Value } from "@radixdlt/radix-engine-toolkit";
import { BigNumber } from "ethers";
import { RadixParser } from "../src/radix/parser/RadixParser";

describe("RadixParser tests", () => {
  it("should decode getPrices SBOR response with hex values", async () => {
    const result = await RadixParser.decodeSborHex(
      "5c21020a90d4838e91010000200c020c3078334644354338314238450d30783543464543394630413538"
    );
    const timestamp = 1724672890000n;
    const priceValues = ["0x3FD5C81B8E", "0x5CFEC9F0A58"];

    const values = expectTupleOfBigIntAndArray<{
      kind: string;
      value: Value[];
    }>(result, timestamp, "String");
    expect(values.map((value) => value.value)).toStrictEqual(priceValues);

    expect(RadixParser.extractValue(result)).toStrictEqual([
      timestamp,
      priceValues,
    ]);
  });

  it("should decode getPrices SBOR response with U256-digits values", async () => {
    const result = await RadixParser.decodeSborHex(
      "5c21020a70832194910100002020020a04c06310cb3c0000000000000000000000000000000000000000000000000000000a0410a9e1b5a9050000000000000000000000000000000000000000000000000000"
    );
    const timestamp = 1724767110000n;
    const priceValues = [261104886720n, 6226459076880n];

    const values = expectTupleOfBigIntAndArray<{
      kind: string;
      elements: Value[];
    }>(result, timestamp, "Array");

    expect(values.map((value) => value.elements)).toStrictEqual(
      priceValues.map(u256Digits)
    );

    expect(RadixParser.extractValue(result)).toStrictEqual([
      timestamp,
      priceValues.map(BigNumber.from),
    ]);
  });

  it("should decode getPriceData SBOR response", async () => {
    const result = await RadixParser.decodeSborHex(
      "5c20210303200a040096ad80590000000000000000000000000000000000000000000000000000000a00db55da930100000a100256da9301000003200a046484b3a5740900000000000000000000000000000000000000000000000000000a00db55da930100000a100256da9301000003200a04c6f72b00000000000000000000000000000000000000000000000000000000000a00db55da930100000a100256da93010000"
    );
    const prices = [384410949120n, 10396600861796n, 2881478n];
    const timestamp = 1734534880000n;
    const blockTimestamp = 1734534890000n;

    const priceData = expectArray<Value>(result, "Tuple");
    prices.forEach((price, index) =>
      expectTupleOfBigIntAndTwoInts(
        priceData[index],
        price,
        timestamp,
        blockTimestamp
      )
    );

    const priceDataObj = RadixParser.extractValue(result);
    expect(priceDataObj).toStrictEqual(
      prices.map(BigNumber.from).map((price) => {
        return [price, timestamp, blockTimestamp];
      })
    );
  });

  it("should decode instantiate SBOR response", async () => {
    const result = await RadixParser.decodeSborHex(
      "5c80c0eb30370cafa2b014b880b80e602470b48ec19d01ee74ac5c603f4f0347"
    );

    expectValue(
      result,
      "String",
      "component_tdx_2_1cr4nqdcv473tq99cszuqucpywz6gasvaq8h8ftzuvql57q684j8xur"
    );
  });

  it("should parse state fields", () => {
    const json =
      '[{"kind":"U8","field_name":"signer_count_threshold","value":"1"},{"kind":"Array","field_name":"signers","element_kind":"Array","elements":[{"kind":"Bytes","element_kind":"U8","hex":"12470f7aba85c8b81d63137dd5925d6ee114952b"},{"kind":"Bytes","element_kind":"U8","hex":"109b4a318a4f5ddcbca6349b45f881b4137deafb"},{"kind":"Bytes","element_kind":"U8","hex":"1ea62d73edf8ac05dfcea1a34b9796e937a29eff"},{"kind":"Bytes","element_kind":"U8","hex":"2c59617248994d12816ee1fa77ce0a64eeb456bf"},{"kind":"Bytes","element_kind":"U8","hex":"83cba8c619fb629b81a65c2e67fe15cf3e3c9747"},{"kind":"Bytes","element_kind":"U8","hex":"f786a909d559f5dee2dc6706d8e5a81728a39ae9"}]},{"kind":"Map","field_name":"prices","key_kind":"Array","value_kind":"Array","entries":[{"key":{"kind":"Array","element_kind":"U64","elements":[{"kind":"U64","value":"4346947"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"}]},"value":{"kind":"Array","element_kind":"U64","elements":[{"kind":"U64","value":"5910281962996"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"}]}},{"key":{"kind":"Array","element_kind":"U64","elements":[{"kind":"U64","value":"4543560"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"}]},"value":{"kind":"Array","element_kind":"U64","elements":[{"kind":"U64","value":"246120063046"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"},{"kind":"U64","value":"0"}]}}]},{"kind":"U64","field_name":"timestamp","value":"1724834030000"}]';
    const signerCountThreshold = 1;
    const timestamp = 1724834030000n;
    const btcPrice = 5910281962996n;
    const ethPrice = 246120063046n;
    const signerValues = [
      "12470f7aba85c8b81d63137dd5925d6ee114952b",
      "109b4a318a4f5ddcbca6349b45f881b4137deafb",
      "1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
      "2c59617248994d12816ee1fa77ce0a64eeb456bf",
      "83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
      "f786a909d559f5dee2dc6706d8e5a81728a39ae9",
    ];

    const obj = JSON.parse(json) as unknown[];
    const result = obj.map(RadixParser.makeManifestValue);

    expect(result.length).toBe(obj.length);
    expectValue(result[0], "U8", signerCountThreshold);

    const signers = expectArray<{ kind: string; value: string }>(
      result[1],
      "String"
    );

    expect(signers.map((value) => value.value)).toStrictEqual(signerValues);

    const values = result[2] as {
      kind: string;
      entries: {
        key: Value;
        value: Value;
      }[];
    };

    const btc = values.entries[0];
    const eth = values.entries[1];

    expectU256(btc.key, 4346947n);
    expectU256(btc.value, btcPrice);
    expectU256(eth.key, 4543560n);
    expectU256(eth.value, ethPrice);

    expectValue(result[3], "U64", timestamp);

    expect(result.map((res) => RadixParser.extractValue(res))).toStrictEqual([
      signerCountThreshold,
      signerValues,
      {
        "0x425443": BigNumber.from(btcPrice),
        "0x455448": BigNumber.from(ethPrice),
      },
      timestamp,
    ]);
  });
});

function expectTupleOfBigIntAndArray<ArrayElementType extends { kind: string }>(
  obj: Value,
  bigintValue: bigint,
  type: string
) {
  expect(obj.kind).toBe("Tuple");
  const fields = (obj as { fields: Value[] }).fields;

  expect(fields.length).toBe(2);
  expectValue(fields[0], "U64", bigintValue);

  return expectArray<ArrayElementType>(fields[1], type);
}

function expectTupleOfBigIntAndTwoInts(
  obj: Value,
  bigintValue: bigint,
  v1: bigint,
  v2: bigint
) {
  expect(obj.kind).toBe("Tuple");
  const fields = (obj as { fields: Value[] }).fields;

  expect(fields.length).toBe(3);
  expectU256(fields[0], bigintValue);
  expectValue(fields[1], "U64", v1);
  expectValue(fields[2], "U64", v2);
}

function expectValue<T>(value: Value, type: string, expectedValue: T) {
  expect(value).toStrictEqual({ kind: type, value: expectedValue });
  expect(RadixParser.extractValue(value)).toBe(expectedValue);
}

function expectU256(value: Value, expectedValue: bigint) {
  const castedValue = value as { kind: string; elements: unknown[] };

  expect(castedValue.kind).toStrictEqual("Array");
  expect(castedValue.elements).toStrictEqual(u256Digits(expectedValue));
  expect(RadixParser.extractValue(value)).toStrictEqual(
    BigNumber.from(expectedValue)
  );
}

function expectArray<ArrayElementType extends { kind: string }>(
  value: Value,
  type: string
) {
  const castedValue = value as unknown as {
    kind: string;
    elementValueKind: string;
    elements: ArrayElementType[];
  };

  // expect(castedValue.elementValueKind).toBe(type);
  expect(castedValue.kind).toBe("Array");
  castedValue.elements.forEach((element) => expect(element.kind).toBe(type));

  return castedValue.elements;
}

function u256Digits(value: bigint) {
  return [
    { kind: "U64", value },
    { kind: "U64", value: 0n },
    { kind: "U64", value: 0n },
    {
      kind: "U64",
      value: 0n,
    },
  ];
}
