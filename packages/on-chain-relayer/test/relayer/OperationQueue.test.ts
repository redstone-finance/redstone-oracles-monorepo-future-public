import { RedstoneCommon } from "@redstone-finance/utils";
import { assert } from "chai";
import sinon from "sinon";
import { OperationQueue } from "../../src/runner/OperationQueue";

const OP_TIME_MS = 20;
const WAIT_FOR_OP_MS = OP_TIME_MS + 5;

describe("OperationQueue tests", () => {
  let sut: OperationQueue;

  beforeEach(() => {
    sut = new OperationQueue();
  });

  it("should add a new operation to the queue", async () => {
    const operation = makeOperationSpy();
    sut.enqueue("op1", operation);

    await RedstoneCommon.sleep(WAIT_FOR_OP_MS);

    assert.isTrue(operation.called);
  });

  it("should replace an existing operation in the queue", async () => {
    const operation1 = makeOperationSpy();
    const operation2 = makeOperationSpy();
    const operation3 = makeOperationSpy();

    sut.enqueue("op1", operation1);
    sut.enqueue("op2", operation2);
    sut.enqueue("op2", operation3);

    await RedstoneCommon.sleep(OP_TIME_MS + WAIT_FOR_OP_MS);

    assert.isTrue(operation1.called);
    assert.isFalse(operation2.called);
    assert.isTrue(operation3.called);
    assert.isTrue(operation1.calledBefore(operation3));
  });

  it("should not replace an active operation", async () => {
    const operation1 = makeOperationSpy();
    const operation2 = makeOperationSpy();

    sut.enqueue("op1", operation1);
    const result = sut.enqueue("op1", operation2);

    assert.isFalse(result);

    await RedstoneCommon.sleep(WAIT_FOR_OP_MS);

    assert.isTrue(operation1.called);
    assert.isFalse(operation2.called);
  });

  it("should process operations in order", async () => {
    const operation1 = makeOperationSpy();
    const operation2 = makeOperationSpy();

    sut.enqueue("op1", operation1);
    sut.enqueue("op2", operation2);

    await RedstoneCommon.sleep(WAIT_FOR_OP_MS);

    assert.isTrue(operation1.calledBefore(operation2));
    assert.isTrue(operation2.called);
  });

  it("should handle operation errors gracefully", async () => {
    const failingOperation = sinon.fake.rejects(new Error("Test error"));
    sut.enqueue("op1", failingOperation);

    await RedstoneCommon.sleep(WAIT_FOR_OP_MS);

    assert(failingOperation.threw);
  });

  function makeOperationSpy() {
    return sinon.fake(async () => {
      await RedstoneCommon.sleep(OP_TIME_MS);
    });
  }
});
