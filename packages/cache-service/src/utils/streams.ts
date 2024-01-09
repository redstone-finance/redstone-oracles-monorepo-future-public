import * as Stream from "stream";
import { Duplex } from "stream";

// To have the bytes returned as an octet-stream there's needed to convert it to a writable stream
// and to pipe it to a response as for StreamableFile - to avoid nest's converting the response to JSON,
// or there's needed to have implemented a custom Interceptor. The solution with streams seems to be simpler.
// In that case it's needed to write the array to a stream and then have a writable stream of it - so the Duplex class is used.
// @See: https://www.derpturkey.com/buffer-to-stream-in-node/
export function duplexStream(array: Uint8Array): Stream {
  const stream = new Duplex();

  stream.push(array);
  stream.push(null);

  return stream;
}
