import { ErrorCode } from "@ethersproject/logger";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { TransactionDeliveryMan } from "../src";
import { Counter } from "../typechain-types";
import { deployCounter } from "./helpers";
import Sinon from "sinon";
import { Contract } from "ethers";
import { error } from "console";
import { ethers } from "hardhat";

chai.use(chaiAsPromised);

const underpricedError = { code: ErrorCode, message: "maxFeePerGas" };

describe("TransactionDeliveryMan", () => {
  let counter!: Counter;

  beforeEach(async () => {
    await ethers.provider.send("hardhat_reset", []);
    counter = await deployCounter();
  });

  it("should deliver transaction", async () => {
    const deliveryMan = new TransactionDeliveryMan({
      expectedDeliveryTimeMs: 20,
      gasLimit: 210000,
    });

    const result = await deliveryMan.deliver(counter, "inc", []);
    await result.wait();

    expect(await counter.getCount()).to.eq(1);
  });

  it("should increase maxGas if transaction failed", async () => {
    const deliveryMan = new TransactionDeliveryMan({
      expectedDeliveryTimeMs: 20,
      gasLimit: 210000,
    });
    const { incStub, mockContract } = createStubCounter(counter);

    incStub.onFirstCall().rejects(underpricedError);
    incStub.onSecondCall().callsFake(counter.inc);

    const result = await deliveryMan.deliver(mockContract, "inc", []);
    await result.wait();
    expect(await counter.getCount()).to.eq(1);

    expect(incStub.firstCall.args[0]).to.deep.equal({
      nonce: 1,
      maxFeePerGas: 1875000000,
      maxPriorityFeePerGas: 1000000000,
      gasLimit: 210000,
    });

    expect(incStub.getCall(1).args[0]).to.deep.equal({
      nonce: 1,
      gasLimit: 210000,
      maxFeePerGas: 2109375000,
      maxPriorityFeePerGas: 1125000000,
    });
  });

  it("should error after max attempts", async () => {
    const deliveryMan = new TransactionDeliveryMan({
      expectedDeliveryTimeMs: 20,
      gasLimit: 210000,
      maxAttempts: 2,
    });
    const { incStub, mockContract } = createStubCounter(counter);

    incStub.onFirstCall().rejects(underpricedError);
    incStub.onSecondCall().rejects(underpricedError);

    await expect(deliveryMan.deliver(mockContract, "inc", [])).rejectedWith();
  });

  it("should increase gas limit for 2d prices", async () => {
    const deliveryMan = new TransactionDeliveryMan({
      expectedDeliveryTimeMs: 20,
      gasLimit: 210000,
      twoDimensionFees: true,
    });
    const { incStub, mockContract } = createStubCounter(counter);
    incStub.onFirstCall().rejects(underpricedError);
    incStub.onSecondCall().callsFake(counter.inc);

    const result = await deliveryMan.deliver(mockContract, "inc", []);
    await result.wait();
    expect(await counter.getCount()).to.eq(1);

    expect(incStub.firstCall.args[0]).to.deep.equal({
      nonce: 1,
      maxFeePerGas: 1875000000,
      maxPriorityFeePerGas: 1000000000,
      gasLimit: 210000,
    });

    expect(incStub.getCall(1).args[0]).to.deep.equal({
      nonce: 1,
      maxFeePerGas: 2109375000,
      maxPriorityFeePerGas: 1125000000,
      gasLimit: 315000,
    });
  });
});

const createStubCounter = (counter: Counter) => {
  const incStub = Sinon.stub();
  const mockContract = {
    inc: incStub,
    signer: counter.signer,
    provider: counter.provider,
  } as unknown as Counter;

  return { mockContract, incStub };
};
