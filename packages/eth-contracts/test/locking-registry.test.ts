import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { RedstoneToken } from "../typechain-types";

describe("Locking registry", () => {
  let token: RedstoneToken,
    locking: Contract,
    signers: SignerWithAddress[],
    authorisedSlasher: SignerWithAddress;

  const deployContracts = async (
    delayForUnlockingInSeconds: number = 100000
  ) => {
    signers = await ethers.getSigners();
    authorisedSlasher = signers[3];

    // Deploy token contract
    const TokenContractFactory = await ethers.getContractFactory(
      "RedstoneToken"
    );
    token = await TokenContractFactory.deploy(1000);
    await token.deployed();

    // Deploy locking contract
    const LockingRegistryFactory = await ethers.getContractFactory(
      "LockingRegistry"
    );
    locking = await upgrades.deployProxy(LockingRegistryFactory, [
      token.address,
      await authorisedSlasher.getAddress(),
      delayForUnlockingInSeconds,
    ]);
  };

  const lockTokens = async (lockingAmount: number) => {
    const approveTx = await token.approve(locking.address, lockingAmount);
    await approveTx.wait();

    const lockingTx = await locking.lock(lockingAmount);
    await lockingTx.wait();
  };

  it("Should properly lock tokens", async () => {
    await deployContracts();
    await lockTokens(100);
    const lockedBalance = await locking.getMaxSlashableAmount(
      signers[0].address
    );
    expect(lockedBalance.toNumber()).to.eql(100);
    const contractBalance = await token.balanceOf(locking.address);
    expect(contractBalance.toNumber()).to.eql(100);
  });

  it("Should properly unlock", async () => {
    const delayForUnlockingInSeconds = 0;
    await deployContracts(delayForUnlockingInSeconds);
    await lockTokens(100);

    // Request unlock
    const reqTx = await locking.requestUnlock(30);
    await reqTx.wait();
    const lockingDetails = await locking.getUserLockingDetails(
      signers[0].address
    );
    expect(lockingDetails.pendingAmountToUnlock.toNumber()).to.eql(30);

    // Complete unlock
    const unlockTx = await locking.completeUnlock();
    await unlockTx.wait();
    const lockedBalance = await locking.getMaxSlashableAmount(
      signers[0].address
    );
    expect(lockedBalance.toNumber()).to.eql(70);
    const contractBalance = await token.balanceOf(locking.address);
    expect(contractBalance.toNumber()).to.eql(70);
    const userBalance = await token.balanceOf(signers[0].address);
    expect(userBalance.toNumber()).to.eql(930);
  });

  it("Should not request unlock for more than locked", async () => {
    await deployContracts();
    await lockTokens(100);

    await expect(locking.requestUnlock(101)).to.be.revertedWith(
      "Can not request to unlock more than locked"
    );
  });

  it("Should not unlock if not requested", async () => {
    const delayForUnlockingInSeconds = 0;
    await deployContracts(delayForUnlockingInSeconds);
    await lockTokens(100);

    await expect(locking.completeUnlock()).to.be.revertedWith(
      "User hasn't requested unlock before"
    );
  });

  it("Should not unlock if not enough time passed", async () => {
    const delayForUnlockingInSeconds = 10000;
    await deployContracts(delayForUnlockingInSeconds);
    await lockTokens(100);

    const reqTx = await locking.requestUnlock(30);
    await reqTx.wait();

    await expect(locking.completeUnlock()).to.be.revertedWith(
      "Unlocking is not opened yet"
    );
  });

  it("Should properly slash lock", async () => {
    await deployContracts();
    await lockTokens(100);

    const tx = await locking
      .connect(authorisedSlasher)
      .slash(signers[0].address, 99);
    await tx.wait();

    const userLockedBalance = await locking.getMaxSlashableAmount(
      signers[0].address
    );
    const slasherBalance = await token.balanceOf(authorisedSlasher.address);
    expect(userLockedBalance.toNumber()).to.eql(1);
    expect(slasherBalance.toNumber()).to.eql(99);
  });

  it("Should not slash lock by unauthorised address", async () => {
    await deployContracts();
    await lockTokens(100);

    await expect(
      locking.connect(signers[1]).slash(signers[0].address, 99)
    ).to.be.revertedWith("Tx sender is not authorised to slash locks");
  });
});
