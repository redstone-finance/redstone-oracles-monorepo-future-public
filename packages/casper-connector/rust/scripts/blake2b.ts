import * as process from "process";
import { casperBlake2b } from "../../src/casper/casper-blake2b";

const dataChunks: Buffer[] = [];

process.stdin.on("data", (chunk: Buffer) => {
  dataChunks.push(chunk);
});

process.stdin.on("end", () => {
  const dataBuffer = Buffer.concat(dataChunks);
  const hash = casperBlake2b(dataBuffer.toString());

  console.log(hash);
});
