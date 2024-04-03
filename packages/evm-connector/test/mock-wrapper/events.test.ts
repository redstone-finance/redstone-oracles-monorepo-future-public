import { expect } from "chai";
import { BigNumber, Event } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleWithEvents } from "../../typechain-types";
import { mockNumericPackages } from "../tests-common";

describe("SampleWithEvents", function () {
  let sampleContract: SampleWithEvents;

  beforeEach(async () => {
    const SampleWithEvents =
      await ethers.getContractFactory("SampleWithEvents");
    sampleContract = await SampleWithEvents.deploy();
  });

  it("Test events with contract wrapping", async function () {
    // Wrapping the contract instnace
    const wrappedContract =
      WrapperBuilder.wrap(sampleContract).usingMockDataPackages(
        mockNumericPackages
      );

    // Sending tx
    const tx = await wrappedContract.emitEventWithLatestOracleValue();
    const receipt = await tx.wait();
    const event: Event = receipt.events![0];

    // Receipt should have parsed events
    expect(receipt.events!.length).to.be.equal(1);
    expect((event.args!._updatedValue! as BigNumber).toNumber()).to.be.gt(0);
    expect(event.event).to.be.equal("ValueUpdated");
  });
});
