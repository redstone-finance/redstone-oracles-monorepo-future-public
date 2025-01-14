import { hexToBytes } from "../src/util";

describe.only("utils", () => {
  it("should serialize signers properly", () => {
    const signer = "0x8BB8F32Df04c8b654987DAaeD53D6B6091e3B774";
    const want = [
      139, 184, 243, 45, 240, 76, 139, 101, 73, 135, 218, 174, 213, 61, 107, 96,
      145, 227, 183, 116,
    ];
    const got = hexToBytes(signer);
    for (let i = 0; i < got.length; i++) {
      expect(got[i]).toEqual(want[i]);
    }
  });
});
