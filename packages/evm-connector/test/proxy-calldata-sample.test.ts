import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { ContractA } from "../typechain-types";

describe("Proxy calldata sample", function () {
  it("Should properly pass data to another contract", async function () {
    const ContractFactory = await ethers.getContractFactory("ContractA");
    const contract: ContractA = await ContractFactory.deploy();
    await contract.deployed();

    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "TSLA", value: 42 }],
    });

    // Example of writing to state
    const tx = await wrappedContract.writeInContractB();
    await tx.wait();

    // Example of reading from contract A (which reads from contract B)
    await wrappedContract.readFromContractBAndSave();
    const lastValueFromContractB =
      await wrappedContract.getLastValueFromContractB();
    expect(lastValueFromContractB.div(10 ** 8).toNumber()).to.be.equal(42);
  });
});
