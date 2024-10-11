import * as zlib from "node:zlib";

interface SerializerDeserializer<T = unknown> {
  serialize(data: T): Buffer;
  deserialize(buffer: Buffer): T;
}

// if the payloads are bigger than 1KB we should use async version
export class DeflateJson implements SerializerDeserializer {
  serialize(data: unknown): Buffer {
    return zlib.deflateSync(JSON.stringify(data));
  }

  deserialize(buffer: Buffer): unknown {
    return JSON.parse(zlib.inflateSync(buffer).toString("utf-8"));
  }
}

export const SerializerDeserializerRegistry = {
  "deflate+json": new DeflateJson(),
};

export type ContentTypes = keyof typeof SerializerDeserializerRegistry;

export function getSerializerDeserializer(name: ContentTypes) {
  const serializerDeserializer = SerializerDeserializerRegistry[name];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!serializerDeserializer) {
    throw new Error(`SerializerDeserializer for ${name} is not implemented`);
  }

  return serializerDeserializer;
}
