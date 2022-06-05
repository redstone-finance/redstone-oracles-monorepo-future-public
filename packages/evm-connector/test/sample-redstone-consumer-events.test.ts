import { expect } from "chai";
import { Event } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { SampleRedstoneConsumerEvents } from "../typechain-types";

describe("SampleRedstoneConsumerEvents", function () {
  it("Should correctly emit events", async function () {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerEvents"
    );
    const contract: SampleRedstoneConsumerEvents =
      await ContractFactory.deploy();
    await contract.deployed();

    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "ETH", value: 42 }],
    });

    // Sending tx and getting receipt
    const tx = await wrappedContract.emitEventWithLatestEthPrice();
    const receipt = await tx.wait();
    const event: Event = receipt.events![0];

    // Receipt should have parsed events
    expect(receipt.events!.length).to.be.equal(1);
    expect(event.args!._ethPrice!.div(10 ** 8).toNumber()).to.be.equal(42);
    expect(event.event).to.be.equal("PriceUpdated");
  });
});
