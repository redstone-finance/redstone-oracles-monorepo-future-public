import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { RedstoneToken } from "../typechain-types";

describe("Contract upgrades tests", () => {
  let token: RedstoneToken,
    signers: SignerWithAddress[],
    lockingRegistry: Contract;

  beforeEach(async () => {
    // Getting test signers
    signers = await ethers.getSigners();

    // Deploy RedStone token
    const TokenContractFactory = await ethers.getContractFactory(
      "RedstoneToken"
    );
    token = await TokenContractFactory.deploy(1000);
    await token.deployed();

    // Deploy locking registry
    const delayForUnlockingInSeconds = 1000;
    const LockingRegistry = await ethers.getContractFactory("LockingRegistry");
    lockingRegistry = await upgrades.deployProxy(LockingRegistry, [
      token.address,
      signers[0].address,
      delayForUnlockingInSeconds,
    ]);
    await lockingRegistry.deployed();
  });

  describe("Locking registry upgrades", () => {
    const lockTokens = async (lockingAmount: number) => {
      const approveTx = await token.approve(
        lockingRegistry.address,
        lockingAmount
      );
      await approveTx.wait();

      const lockingTx = await lockingRegistry.lock(lockingAmount);
      await lockingTx.wait();
    };

    it("Should work as original version (lock tokens)", async () => {
      await lockTokens(100);
      const lockedBalance = await lockingRegistry.getMaxSlashableAmount(
        signers[0].address
      );
      expect(lockedBalance.toNumber()).to.eql(100);
    });

    it("Should properly upgrade", async () => {
      const LockingRegistryV2 = await ethers.getContractFactory(
        "LockingRegistryV2"
      );
      const lockingRegistryV2 = await upgrades.upgradeProxy(
        lockingRegistry.address,
        LockingRegistryV2
      );

      expect(lockingRegistryV2.address).to.eql(lockingRegistry.address);
      expect((await lockingRegistryV2.newFunction()).toNumber()).to.eql(42);
      await expect(lockTokens(100)).to.be.revertedWith("Disabled in V2");
    });
  });

  describe("Vesting wallet upgrades", () => {
    let vestingWallet: Contract;

    beforeEach(async () => {
      // Deploying VestingWallet contract
      const allocation = 100,
        start = 0,
        cliffDuration = 0,
        vestingDuration = 0;
      const VestingWallet = await ethers.getContractFactory("VestingWallet");
      vestingWallet = await upgrades.deployProxy(VestingWallet, [
        token.address,
        signers[0].address,
        lockingRegistry.address,
        allocation,
        start,
        cliffDuration,
        vestingDuration,
      ]);
    });

    it("Should properly upgrade", async () => {
      const VestingWalletV2 = await ethers.getContractFactory(
        "VestingWalletV2"
      );
      const vestingWalletV2 = await upgrades.upgradeProxy(
        vestingWallet.address,
        VestingWalletV2
      );

      expect(vestingWalletV2.address).to.eql(vestingWallet.address);
      expect((await vestingWalletV2.getLockedAmount(0)).toNumber()).to.eql(42);
    });
  });
});
