import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import Sinon from "sinon";
import { CuratedRpcList } from "../../src/providers/CuratedRpcList";

chai.use(chaiAsPromised);

const createList = (
  rpcIdentifiers: string[],
  maxErrorRate: number = 0.1,
  minimalProvidersCount = 1
) =>
  new CuratedRpcList(
    {
      resetQuarantineInterval: 100,
      minimalProvidersCount,
      evaluationInterval: 10,
      maxErrorRate,
      rpcIdentifiers,
    },
    -1
  );

describe("Curated rpc list", () => {
  let clock: Sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = Sinon.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    clock.restore();
  });

  it("till first evaluation all rpcs should be returned", () => {
    const list = createList(["A", "B"]);

    list.scoreRpc("A", { error: true });
    list.scoreRpc("B", { error: true });

    expect(list.getBestProviders()).to.deep.equal(["A", "B"]);
  });

  it("after first evaluation bad rpcs should be move to quarantine", () => {
    const list = createList(["A", "B"]);

    list.scoreRpc("A", { error: false });
    list.scoreRpc("B", { error: true });
    clock.tick(10);

    expect(list.getBestProviders()).to.deep.equal(["A"]);
  });

  it("after first evaluation bad rpcs should be move to quarantine 51% error rate", () => {
    const list = createList(["A", "B"], 0.51);

    list.scoreRpc("A", { error: false });
    list.scoreRpc("A", { error: true });
    list.scoreRpc("B", { error: true });
    list.scoreRpc("B", { error: true });
    clock.tick(10);

    expect(list.getBestProviders()).to.deep.equal(["A"]);
  });

  it("should return all providers not crossing error count", () => {
    const list = createList(["A", "B", "C"]);

    list.scoreRpc("A", { error: false });
    list.scoreRpc("B", { error: true });
    list.scoreRpc("C", { error: false });
    clock.tick(100);
    list.scoreRpc("A", { error: false });
    list.scoreRpc("B", { error: false });
    list.scoreRpc("C", { error: true });
    clock.tick(10);

    expect(list.getBestProviders()).to.deep.equal(["A", "B"]);
  });

  it("should free one rpc from quarantine after given time", () => {
    const list = createList(["A", "B"], 0.1, 1);

    list.scoreRpc("B", { error: true });
    clock.tick(10);
    expect(list.getBestProviders()).to.deep.equal(["A"]);
    clock.tick(90);
    expect(list.getBestProviders()).to.deep.equal(["A", "B"]);
  });

  it("should free one rpc from qurantine when minimalProvidersCount is not satisfied", () => {
    const list = createList(["A", "B"], 0.1, 2);

    list.scoreRpc("A", { error: false });
    list.scoreRpc("B", { error: true });
    clock.tick(10);
    expect(list.getBestProviders()).to.deep.equal(["A", "B"]);
  });

  it("should free two rpcs from qurantine when minimalProvidersCount is not satisfied", () => {
    const list = createList(["A", "B"], 0.1, 2);

    list.scoreRpc("A", { error: true });
    list.scoreRpc("B", { error: true });
    clock.tick(10);
    expect(list.getBestProviders()).to.deep.equal(["A", "B"]);
  });

  it("rpc after qurantine has clear state", () => {
    const list = createList(["A"], 0.9, 0);

    list.scoreRpc("A", { error: true });
    clock.tick(100);
    list.scoreRpc("A", { error: false });

    expect(list.getBestProviders()).to.deep.equal(["A"]);
  });

  it("rpc after evaluation has clear state", () => {
    const list = createList(["A"], 0.5, 0);

    list.scoreRpc("A", { error: false });
    list.scoreRpc("A", { error: false });
    clock.tick(10);
    list.scoreRpc("A", { error: true });
    clock.tick(10);

    expect(list.getBestProviders()).to.deep.equal([]);
  });

  it("throw on duplicated providers", () => {
    expect(() => createList(["A", "A"])).to.throw(/duplicated rpc/);
  });

  it("work when rpc is evaluated before score", () => {
    const list = createList(["A", "B"], 0.1, 1);
    list.evaluateRpcScore("A");
    expect(list.getBestProviders()).deep.equal(["A", "B"]);
  });

  it("should reset rpcs based on weighted propability (quarnatineCounter)", () => {
    const rpcs = ["A", "B", "C", "D"];
    const list = createList(rpcs, 0.1, 1);

    const putEveryRpcToQuarantine = () => {
      for (const rpc of rpcs) {
        list.scoreRpc(rpc, { error: true });
        list.evaluateRpcScore(rpc);
        list.state["A"].quarantineCounter = 100;
        list.state["B"].quarantineCounter = 200;
        list.state["C"].quarantineCounter = 300;
        list.state["D"].quarantineCounter = 400;
      }
    };

    const pickedCounter: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      putEveryRpcToQuarantine();
      list.freeOneRpcFromQuarantine();
      const picked = list.getBestProviders();
      expect(picked.length).to.eq(1);
      pickedCounter[picked[0]] += 1;
    }

    function assertPickedPercentage(rpc: string, expectedPercentage: number) {
      expect((pickedCounter[rpc] / iterations) * 100).to.be.closeTo(
        expectedPercentage,
        15
      );
    }

    assertPickedPercentage("A", 40);
    assertPickedPercentage("B", 30);
    assertPickedPercentage("C", 20);
    assertPickedPercentage("D", 10);
  });
});
