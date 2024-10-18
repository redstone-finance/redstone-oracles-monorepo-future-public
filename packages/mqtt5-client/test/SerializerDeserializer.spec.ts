import {
  ContentTypes,
  DeflateJson,
  getSerializerDeserializer,
  SerializerDeserializerRegistry,
} from "../src/SerializerDeserializer";

describe("SerializerDeserializer", () => {
  // Generic test for any SerializerDeserializer
  const testSerializerDeserializer = <T>(name: ContentTypes, testData: T) => {
    describe(`${name}`, () => {
      const serializerDeserializer = getSerializerDeserializer(name);

      it("should serialize and deserialize data correctly", () => {
        const serialized = serializerDeserializer.serialize(testData);
        const deserialized = serializerDeserializer.deserialize(serialized);
        expect(deserialized).toEqual(testData);
      });

      it("should return a Buffer when serializing", () => {
        const serialized = serializerDeserializer.serialize(testData);
        expect(Buffer.isBuffer(serialized)).toBe(true);
      });

      it("should handle empty objects", () => {
        const emptyObject = {};
        const serialized = serializerDeserializer.serialize(emptyObject);
        const deserialized = serializerDeserializer.deserialize(serialized);
        expect(deserialized).toEqual(emptyObject);
      });

      it("should handle complex nested objects", () => {
        const complexObject = {
          a: 1,
          b: "string",
          c: [1, 2, 3],
          d: { nested: true },
          e: null,
          f: undefined,
        };
        const serialized = serializerDeserializer.serialize(complexObject);
        const deserialized = serializerDeserializer.deserialize(serialized);
        expect(deserialized).toEqual(complexObject);
      });
    });
  };

  // Test all registered SerializerDeserializers
  Object.keys(SerializerDeserializerRegistry).forEach((name) => {
    testSerializerDeserializer(name as ContentTypes, {
      timestampMilliseconds: 1728050430000,
      signature:
        "KJyYNpew/HNeNG5idA4GeGPL9dV5b4MTfW/gY2CGZvBx8nSStCbEYS20E0ZeEWLFUKj0yMAB7fu9KqvcTc1DtBs=",
      isSignatureValid: true,
      dataPoints: [
        {
          dataFeedId: "3Crv",
          value: 1.0350670323387625,
          metadata: {
            value: "1.0350670323387625",
            sourceMetadata: {
              "ethereum-evm-fetcher-curve": { value: "1.0350670323387625" },
            },
            nodeLabel: "fallback",
          },
        },
      ],
      dataServiceId: "redstone-primary-prod",
      dataFeedId: "3Crv",
      dataPackageId: "3Crv",
      signerAddress: "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202",
    });
  });

  // Test getSerializerDeserializer function
  describe("getSerializerDeserializer", () => {
    it("should return the correct SerializerDeserializer", () => {
      const deflateJson = getSerializerDeserializer("deflate+json");
      expect(deflateJson).toBeInstanceOf(DeflateJson);
    });

    it("should throw an error for non-existent SerializerDeserializer", () => {
      expect(() =>
        getSerializerDeserializer("non-existent" as "deflate+json")
      ).toThrow("SerializerDeserializer for non-existent is not implemented");
    });
  });
});
