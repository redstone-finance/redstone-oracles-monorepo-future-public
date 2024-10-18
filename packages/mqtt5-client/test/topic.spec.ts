import { decodeTopic, encodeTopic } from "../src/topics";

describe("topics", () => {
  it("should encode and decode topic", () => {
    expect(encodeTopic(["$SYS", "1", "2+", "#"])).toEqual("$SYS/1/2%2B/#");
    expect(decodeTopic(encodeTopic(["$SYS", "1", "2+", "#"]))).toEqual(
      "$SYS/1/2+/#"
    );

    expect(encodeTopic(["$SYS", "1", "+", "#"])).toEqual("$SYS/1/+/#");
    expect(decodeTopic(encodeTopic(["$SYS", "1", "+", "#"]))).toEqual(
      "$SYS/1/+/#"
    );

    expect(encodeTopic(["xd", "$", "+", "#"])).toEqual("xd/%24/+/#");
    expect(decodeTopic(encodeTopic(["xd", "$", "+", "#"]))).toEqual("xd/$/+/#");

    expect(encodeTopic(["xd", "A/B", "+", "#"])).toEqual("xd/A%2FB/+/#");
    expect(decodeTopic(encodeTopic(["xd", "A/B", "+", "#"]))).toEqual(
      "xd/A/B/+/#"
    );
  });
});
