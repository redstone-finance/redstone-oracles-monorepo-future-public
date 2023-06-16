import axios from "axios";
import { expect } from "chai";
import Sinon from "sinon";
import { fetchWithCache } from "../src/common";

describe("common", () => {
  describe("fetchWithCache", () => {
    let getSpy: any;

    before(() => {
      getSpy = Sinon.stub(axios, "get");
    });

    after(() => {
      getSpy.restore();
    });

    it("uses cache in ttl threshold", async () => {
      getSpy
        .onFirstCall()
        .resolves({ data: "1" })
        .onSecondCall()
        .resolves({ data: "2" });

      await fetchWithCache("https://redstone.kox", 100000);
      expect((await fetchWithCache("https://redstone.kox", 100000)).data).to.eq(
        "1"
      );
    });

    it("doesn't use cache in ttl threshold", async () => {
      getSpy
        .onFirstCall()
        .resolves({ data: "1" })
        .onSecondCall()
        .resolves({ data: "2" });

      await fetchWithCache("https://redstone.kox", 100000);
      expect((await fetchWithCache("https://redstone.kox", -1)).data).to.eq(
        "2"
      );
    });
  });
});
