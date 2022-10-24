import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { RedstoneToken } from "../typechain-types";

describe("Redstone token", () => {
  let contract: RedstoneToken, signers: Signer[];

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("RedstoneToken");
    contract = await ContractFactory.deploy(1000);
    await contract.deployed();
    signers = await ethers.getSigners();
  });

  it("Should properly transfer tokens", async () => {
    const addr1 = await signers[0].getAddress();
    const addr2 = await signers[1].getAddress();
    expect(await contract.balanceOf(addr1)).to.equal(1000);

    const tx = await contract.transfer(addr2, 700);
    await tx.wait();

    expect(await contract.balanceOf(addr1)).to.equal(300);
    expect(await contract.balanceOf(addr2)).to.equal(700);
  });
});
