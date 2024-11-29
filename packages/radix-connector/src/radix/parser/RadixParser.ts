import {
  NetworkId,
  RadixEngineToolkit,
  SerializationMode,
  Value,
} from "@radixdlt/radix-engine-toolkit";
import { BigNumber } from "ethers";
import { GeneratedConverter, SerializableManifestValue } from "./generated";

interface ObjInterface {
  kind: string;
  element_kind?: string;
  key_kind?: string;
  value_kind?: string;
  fields?: ObjInterface[];
  elements?: string[];
  entries?: { key: ObjInterface; value: ObjInterface }[];
  value: string;
  hex?: string;
}

export type U256Digits = { elements: { value: bigint }[] };

export class RadixParser {
  static async decodeSborHex(hex: string, networkId = NetworkId.Stokenet) {
    const buffer = Buffer.from(hex, "hex");

    const value = await RadixEngineToolkit.ScryptoSbor.decodeToString(
      buffer,
      networkId,
      SerializationMode.Model
    );

    return RadixParser.makeManifestValue(JSON.parse(value));
  }

  static convertValue<T>(obj: unknown): T {
    return RadixParser.extractValue(this.makeManifestValue(obj)) as T;
  }

  static makeManifestValue(obj: unknown) {
    return GeneratedConverter.ManifestValue.fromGenerated(
      RadixParser.makeSerializableManifestValue(obj as ObjInterface)
    );
  }

  static extractValue(obj?: Value, asKeyName = false): unknown {
    if (obj === undefined) {
      return undefined;
    }

    const simpleObject =
      (obj as unknown as { value?: unknown }).value ??
      (obj as unknown as { fields?: Value[] }).fields?.map((field) =>
        RadixParser.extractValue(field)
      );

    if (simpleObject !== undefined) {
      return simpleObject;
    }

    const array = obj as unknown as {
      kind: string;
      elementValueKind: string;
      elements?: Value[];
    };

    if (array.elements) {
      if (
        array.kind === "Array" &&
        array.elementValueKind === "U64" &&
        array.elements.length === 4
      ) {
        const u256 = RadixParser.parseU256Digits(array as U256Digits);
        return asKeyName ? u256.toHexString() : u256;
      } else {
        return array.elements.map((element) =>
          RadixParser.extractValue(element)
        );
      }
    }

    const map = obj as unknown as {
      kind: string;
      keyValueKind: string;
      valueValueKind: string;
      entries: { key: Value; value: Value }[];
    };

    const entries = map.entries.map(({ key, value }) => {
      return [
        RadixParser.extractValue(key, true),
        RadixParser.extractValue(value),
      ];
    });

    return Object.fromEntries(entries);
  }

  /// Warning: not all interfaces might be supported here
  private static makeSerializableManifestValue(
    obj: ObjInterface
  ): SerializableManifestValue {
    if (obj.kind === "Array" && !obj.elements) {
      if (Array.isArray(obj.value)) {
        /// a number-digits representation
        return {
          kind: "Array",
          value: {
            element_value_kind: "U64",
            elements: (obj.value as unknown as string[]).map((entry) =>
              RadixParser.makeSerializableManifestValue({
                kind: "U64",
                value: entry,
              })
            ),
          },
        } as SerializableManifestValue;
      }

      return RadixParser.makeSerializableManifestValue(
        obj.value as unknown as ObjInterface
      );
    }

    if (!["string", "undefined"].includes(typeof obj.value)) {
      return obj as unknown as SerializableManifestValue;
    }

    return {
      kind: RadixParser.normalizeKind(obj.kind),
      value: {
        ...obj,
        value: obj.kind === "Bytes" ? obj.hex : obj.value,
        element_value_kind: RadixParser.normalizeKind(obj.element_kind),
        key_value_kind: RadixParser.normalizeKind(obj.key_kind),
        value_value_kind: RadixParser.normalizeKind(obj.value_kind),
        fields: obj.fields?.map(RadixParser.makeSerializableManifestValue),
        elements: obj.elements?.map((value) =>
          RadixParser.makeSerializableManifestValue({
            kind: RadixParser.normalizeKind(obj.element_kind)!,
            value,
          })
        ),
        entries: obj.entries?.map(({ key, value }) => ({
          key: RadixParser.makeSerializableManifestValue(key),
          value: RadixParser.makeSerializableManifestValue(value),
        })),
      },
    } as SerializableManifestValue;
  }

  private static normalizeKind(kind?: string) {
    return ["Bytes", "Reference"].includes(kind ?? "") ? "String" : kind;
  }

  private static parseU256Digits(digits: U256Digits) {
    return digits.elements.reduce((acc, element, index) => {
      const shift = BigNumber.from(2).pow(index * 64);
      const part = BigNumber.from(element.value).mul(shift);

      return acc.add(part);
    }, BigNumber.from(0));
  }
}
