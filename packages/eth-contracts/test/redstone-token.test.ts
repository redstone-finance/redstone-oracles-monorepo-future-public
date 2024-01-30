import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { RedstoneToken } from "../typechain-types";

describe("RedStone token", () => {
  let contract: RedstoneToken;
  let minter: Signer;
  let other: Signer;
  let minterAddr: string;
  let otherAddr: string;

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("RedstoneToken");
    contract = await ContractFactory.deploy(1000);
    await contract.deployed();
    [minter, other] = await ethers.getSigners();
    minterAddr = await minter.getAddress();
    otherAddr = await other.getAddress();
  });

  it("Should properly transfer tokens", async () => {
    expect(await contract.balanceOf(minterAddr)).to.equal(1000);

    const tx = await contract.transfer(otherAddr, 700);
    await tx.wait();

    expect(await contract.balanceOf(minterAddr)).to.equal(300);
    expect(await contract.balanceOf(otherAddr)).to.equal(700);
  });

  it("Should not mint from account other than the minter", async () => {
    contract = contract.connect(other);

    await expect(contract.mint(otherAddr, 100)).to.be.revertedWith(
      "RedstoneToken: minting by an unauthorized address"
    );
  });

  it("Should mint from minter account", async () => {
    expect(await contract.balanceOf(otherAddr)).to.equal(0);

    const tx = await contract.mint(otherAddr, 100);
    await tx.wait();

    expect(await contract.balanceOf(otherAddr)).to.equal(100);
  });

  it("Should mint max supply", async () => {
    let max = ethers.utils.parseEther("50000000");

    const tx = await contract.mint(minterAddr, max.sub(1000));
    await tx.wait();

    expect(await contract.balanceOf(minterAddr)).to.equal(max);
  });

  it("Should not mint more than max supply", async () => {
    let max = ethers.utils.parseEther("50000000");

    const tx = await contract.mint(minterAddr, max.sub(1000));
    await tx.wait();

    await expect(contract.mint(minterAddr, 1)).to.be.revertedWith(
      "RedstoneToken: cannot mint more than MAX SUPPLY"
    );
  });

  it("Should not update minter from unauthorized account", async () => {
    contract = contract.connect(other);

    await expect(contract.updateMinter(otherAddr)).to.be.revertedWith(
      "RedstoneToken: minter update by an unauthorized address"
    );
  });

  it("Should update minter ", async () => {
    const tx = await contract.updateMinter(otherAddr);
    await tx.wait();

    expect(await contract.minter()).to.equal(otherAddr);
  });
});
