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

  it("Should not init contract with too high total supply", async () => {
    const ContractFactory = await ethers.getContractFactory("RedstoneToken");
    const tooBigSupply = ethers.utils.parseEther("50000000").add(1);
    await expect(ContractFactory.deploy(tooBigSupply)).to.be.revertedWith(
      "CanNotMintMoreThanMaxSupply"
    );
  });

  it("Should properly transfer tokens", async () => {
    expect(await contract.balanceOf(minterAddr)).to.equal(1000);

    const transferTx = await contract.transfer(otherAddr, 700);
    await transferTx.wait();

    expect(transferTx).to.emit("Transfer").withArgs(otherAddr, minterAddr, 700);
    expect(await contract.balanceOf(minterAddr)).to.equal(300);
    expect(await contract.balanceOf(otherAddr)).to.equal(700);
  });

  it("Should not mint from account other than the minter", async () => {
    contract = contract.connect(other);

    await expect(contract.mint(otherAddr, 100)).to.be.revertedWith(
      "OnlyMinterCanMint"
    );
  });

  it("Should mint from minter account", async () => {
    expect(await contract.balanceOf(otherAddr)).to.equal(0);

    const tx = await contract.mint(otherAddr, 100);
    await tx.wait();

    expect(await contract.balanceOf(otherAddr)).to.equal(100);
  });

  it("Should mint max supply", async () => {
    const max = ethers.utils.parseEther("50000000");

    const tx = await contract.mint(minterAddr, max.sub(1000));
    await tx.wait();

    expect(await contract.balanceOf(minterAddr)).to.equal(max);
  });

  it("Should not mint more than max supply", async () => {
    const max = ethers.utils.parseEther("50000000");

    const tx = await contract.mint(minterAddr, max.sub(1000));
    await tx.wait();

    await expect(contract.mint(minterAddr, 1)).to.be.revertedWith(
      "CanNotMintMoreThanMaxSupply"
    );
  });

  it("Should properly update minter ", async () => {
    const proposalTx = await contract.proposeNewMinter(otherAddr);
    await proposalTx.wait();
    expect(proposalTx).to.emit("MinterProposal").withArgs(otherAddr);
    expect(await contract.minter()).to.equal(minterAddr);
    expect(await contract.proposedMinter()).to.equal(otherAddr);

    const acceptRoleTx = await contract.connect(other).acceptMinterRole();
    await acceptRoleTx.wait();
    expect(acceptRoleTx).to.emit("MinterUpdate").withArgs(otherAddr);
    expect(await contract.minter()).to.equal(otherAddr);
    expect(await contract.proposedMinter()).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("Should not propose new minter from an unauthorized account", async () => {
    await expect(
      contract.connect(other).proposeNewMinter(otherAddr)
    ).to.be.revertedWith("OnlyMinterCanProposeNewMinter");
  });

  it("Should not accept minter role from an unauthorized account", async () => {
    const proposalTx = await contract.proposeNewMinter(otherAddr);
    await proposalTx.wait();
    await expect(contract.acceptMinterRole()).to.be.revertedWith(
      "OnlyProposedMinterCanAcceptMinterRole"
    );
  });
});
