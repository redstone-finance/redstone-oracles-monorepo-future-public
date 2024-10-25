import { expect } from "chai";
import { areFeedsCommaSeparated, isUrl } from "../src/validations";

describe("Validations", () => {
  describe("#isUrl", () => {
    it("should return true for valid URLs", () => {
      expect(isUrl("")).to.be.equal(true);
      expect(isUrl("https://www.example.com")).to.be.equal(true);
      expect(isUrl("http://example.com")).to.be.equal(true);
      expect(isUrl("ftp://example.com")).to.be.equal(true);
      expect(isUrl("https://example.com/path?query=string")).to.be.equal(true);
      expect(isUrl("https://subdomain.example.com")).to.be.equal(true);
      expect(isUrl("https://example.com:8080")).to.be.equal(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isUrl("random string")).to.be.equal(false);
      expect(isUrl("www.example.com")).to.be.equal(false);
      expect(isUrl("http//example.com")).to.be.equal(false);
      expect(isUrl("https://")).to.be.equal(false);
      expect(isUrl("http//invalid-url")).to.be.equal(false);
      expect(isUrl("not_a_url")).to.be.equal(false);
    });
  });

  describe("#areFeedsCommaSeparated", () => {
    it("should return true for valid value", () => {
      expect(areFeedsCommaSeparated("feed1,feed2,feed3")).to.be.equal(true);
      expect(areFeedsCommaSeparated("feed1")).to.be.equal(true);
    });

    it("should return false for invalid value", () => {
      expect(areFeedsCommaSeparated("")).to.be.equal(false);
      expect(areFeedsCommaSeparated(",")).to.be.equal(false);
      expect(areFeedsCommaSeparated(",,")).to.be.equal(false);
      expect(areFeedsCommaSeparated("feed1 feed2 feed3")).to.be.equal(false);
    });
  });
});
