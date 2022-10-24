import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { generateSaltForVote } from "../src/utils";
import {
  DisputeResolutionEngine,
  RedstoneToken,
  LockingRegistry,
} from "../typechain-types";

interface ExpectedVote {
  expectToBeRevealed: boolean;
  expectVotedForGuilty: boolean;
  expectedLockedTokensAmount: number;
}

interface ExpectedDispute {
  expectedVerdict: number;
  rewardPoolTokensAmount: number;
}

const AMOUNT_TO_LOCK = 100_000;
const TOTAL_SUPPLY = 10_000_000;
const TEST_VOTER_BALANCE = 20_000;
const MIN_LOCK_AMOUNT_FOR_VOTING = 5000;
const LOCKED_AMOUNT_FOR_DISPUTE_CREATION = 10_000;
const LOCKED_BY_VOTERS = [5000, 10_000, 5000];
const COMMIT_PERIOD_SECONDS = 4 * 24 * 3600; // 4 days
const REVEAL_PERIOD_SECONDS = 3 * 24 * 3600; // 3 days
const DISPUTE_VERDICT = {
  Unknown: 0,
  Guilty: 1,
  NotGuilty: 2,
};

const toBigNum = (amount: number): BigNumber => {
  return parseEther(String(amount));
};

describe("Dispute resolution engine", () => {
  let signers: SignerWithAddress[],
    redstoneAdmin: SignerWithAddress,
    dataProvider: SignerWithAddress,
    disputeCreator: SignerWithAddress,
    voters: SignerWithAddress[],
    token: RedstoneToken,
    locking: LockingRegistry,
    disputeResolutionEngine: DisputeResolutionEngine;
  const disputeId = 0; // Will be used for majority of tests

  beforeEach(async () => {
    // Adjust roles
    signers = await ethers.getSigners();
    redstoneAdmin = signers[0];
    dataProvider = signers[1];
    voters = [signers[2], signers[3], signers[4]];
    disputeCreator = signers[5];

    // Deploy `token`, and `disputeResolutionEngine`, initialize `locking`
    await deployContracts();

    // Allocate tokens and lock tokens by the test data provider
    await prepareContracts();
  });

  it("Should properly create dispute", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );

    await checkDisputes([
      {
        expectedVerdict: DISPUTE_VERDICT.Unknown,
        rewardPoolTokensAmount: LOCKED_AMOUNT_FOR_DISPUTE_CREATION,
      },
    ]);
    await checkVote(disputeId, disputeCreator.address, {
      expectedLockedTokensAmount: LOCKED_AMOUNT_FOR_DISPUTE_CREATION,
      expectToBeRevealed: true,
      expectVotedForGuilty: true,
    });
  });

  it("Should not create dispute if not enough tokens locked", async () => {
    await expect(createDispute(dataProvider.address, 9999)).to.be.revertedWith(
      "Insufficient locked tokens amount for dispute creation"
    );
  });

  it("Should properly commit vote", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );
    await commitVote(disputeId, MIN_LOCK_AMOUNT_FOR_VOTING, true, voters[0]);

    await checkVote(disputeId, voters[0].address, {
      expectedLockedTokensAmount: MIN_LOCK_AMOUNT_FOR_VOTING,
      expectToBeRevealed: false,
      expectVotedForGuilty: false, // Unknown yet
    });
  });

  it("Should not commit vote with insufficient amount of tokens", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );

    await expect(
      commitVote(disputeId, MIN_LOCK_AMOUNT_FOR_VOTING - 1, true, voters[0])
    ).to.be.revertedWith("Insufficient locked tokens amount for voting");
  });

  it("Should not commit vote twice for the same dispute", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );
    await commitVote(disputeId, LOCKED_BY_VOTERS[0], true, voters[0]);

    await expect(
      commitVote(disputeId, MIN_LOCK_AMOUNT_FOR_VOTING, true, voters[0])
    ).to.be.revertedWith("Already locked some tokens for this dispute");
  });

  it("Should not reveal too early", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );
    await commitVote(disputeId, MIN_LOCK_AMOUNT_FOR_VOTING, true, voters[0]);
    await expect(revealVote(disputeId, true, voters[0])).to.be.revertedWith(
      "Reveal period hasn't started yet"
    );
  });

  it("Should commit and reveal vote", async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );
    await commitVote(disputeId, MIN_LOCK_AMOUNT_FOR_VOTING, true, voters[0]);
    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);
    await revealVote(disputeId, true, voters[0]);

    await checkVote(disputeId, voters[0].address, {
      expectedLockedTokensAmount: MIN_LOCK_AMOUNT_FOR_VOTING,
      expectToBeRevealed: true,
      expectVotedForGuilty: true,
    });
  });

  it("Should not reveal with an incorrect salt", async () => {
    await createDispute(dataProvider.address, 10000);
    await commitVote(disputeId, 5000, true, voters[0]);
    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);

    await expect(revealVote(disputeId, false, voters[0])).to.be.revertedWith(
      "Commited hash doesn't match with the revealed vote"
    );
  });

  it("Should properly settle dispute", async () => {
    await launchDisputeAndVoteByAllVoters();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(disputeId);

    await checkDisputes([
      {
        expectedVerdict: DISPUTE_VERDICT.Guilty,
        rewardPoolTokensAmount: 32_000,
      },
    ]);
  });

  it("Should not settle dispute that has not ended", async () => {
    await launchDisputeAndVoteByAllVoters();

    await expect(settleDispute(disputeId)).to.be.revertedWith(
      "Settlement period hasn't started yet"
    );
  });

  it("Should not settle dispute that has already been settled", async () => {
    await launchDisputeAndVoteByAllVoters();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(disputeId);

    await expect(settleDispute(disputeId)).to.be.revertedWith(
      "Dispute has already been settled"
    );
  });

  it("Should properly claim rewards for settled dispute", async () => {
    await launchDisputeAndVoteByAllVoters();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(disputeId);

    // Test claiming
    await claimRewardAndCheckBalance(disputeId, voters[0], 8000);
    await claimRewardAndCheckBalance(disputeId, voters[2], 8000);
    await claimRewardAndCheckBalance(disputeId, disputeCreator, 16_000);
    expect(
      claimRewardAndCheckBalance(disputeId, voters[1], 1)
    ).to.be.revertedWith("User didn't win the dispute");
  });

  it("Should not claim reward twice for the same dispute", async () => {
    await launchDisputeAndVoteByAllVoters();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(disputeId);

    await claimRewardAndCheckBalance(disputeId, voters[0], 8000);
    await expect(
      claimRewardAndCheckBalance(disputeId, voters[0], 8000)
    ).to.be.revertedWith("User already claimed reward for this dispute");
  });

  const deployContracts = async () => {
    // Deploy token contract
    const TokenContractFactory = await ethers.getContractFactory(
      "RedstoneToken"
    );
    token = await TokenContractFactory.deploy(toBigNum(TOTAL_SUPPLY));
    await token.deployed();

    // Deploy the dispute resolution engine contract
    const DisputeResolutionEngineFactory = await ethers.getContractFactory(
      "DisputeResolutionEngine"
    );
    disputeResolutionEngine = await DisputeResolutionEngineFactory.deploy(
      token.address
    );

    // Attachig locking registry (which was created by dispute resolution engine)
    const lockingRegistryAddress =
      await disputeResolutionEngine.getLockingRegistryAddress();
    const LockingRegistryFactory = await ethers.getContractFactory(
      "LockingRegistry"
    );
    locking = LockingRegistryFactory.attach(lockingRegistryAddress);
  };

  const sendTokensFromAdmin = async (recipient: string, amount: number) => {
    const tx = await token
      .connect(redstoneAdmin)
      .transfer(recipient, toBigNum(amount));
    await tx.wait();
  };

  const approveTokens = async (
    spender: string,
    amount: number,
    signer: SignerWithAddress
  ) => {
    const tx = await token.connect(signer).approve(spender, toBigNum(amount));
    await tx.wait();
  };

  const prepareContracts = async () => {
    // Allocate tokens
    await sendTokensFromAdmin(dataProvider.address, AMOUNT_TO_LOCK);
    await sendTokensFromAdmin(disputeCreator.address, TEST_VOTER_BALANCE);
    for (const voter of voters) {
      await sendTokensFromAdmin(voter.address, TEST_VOTER_BALANCE);
    }

    // Lock tokens by the dataProvider
    await approveTokens(locking.address, AMOUNT_TO_LOCK, dataProvider);
    const lockingTx = await locking
      .connect(dataProvider)
      .lock(toBigNum(AMOUNT_TO_LOCK));
    await lockingTx.wait();
  };

  const createDispute = async (
    accusedAddress: string,
    lockedTokensAmount: number
  ) => {
    await approveTokens(
      disputeResolutionEngine.address,
      lockedTokensAmount,
      disputeCreator
    );
    const tx = await disputeResolutionEngine
      .connect(disputeCreator)
      .createDispute(
        accusedAddress,
        "MOCK_ARWEAVE_URL",
        toBigNum(lockedTokensAmount)
      );
    await tx.wait();
  };

  const checkDisputes = async (expectedDisputes: ExpectedDispute[]) => {
    // Checking expected number of disputes
    const disputesCountBigNum =
      await disputeResolutionEngine.getDisputesCount();
    expect(disputesCountBigNum.toNumber()).to.eql(expectedDisputes.length);

    // Checking each dispute
    for (let disputeId = 0; disputeId < expectedDisputes.length; disputeId++) {
      const disputeDetails = await disputeResolutionEngine.getDisputeDetails(
        disputeId
      );
      const expectedDispute = expectedDisputes[disputeId];
      expect(disputeDetails.verdict).to.eql(expectedDispute.expectedVerdict);
      expect(disputeDetails.rewardPoolTokensAmount).to.eql(
        toBigNum(expectedDispute.rewardPoolTokensAmount)
      );
    }
  };

  const commitVote = async (
    disputeId: number,
    lockedTokensAmount: number,
    votedForGuilty: boolean,
    voter: SignerWithAddress
  ) => {
    // Prepare salt and hash
    const voteSalt = await generateSaltForVote(disputeId, voter);
    const commitHash = await disputeResolutionEngine.calculateHashForVote(
      disputeId,
      voteSalt,
      votedForGuilty
    );

    // Sending a vote
    await approveTokens(
      disputeResolutionEngine.address,
      lockedTokensAmount,
      voter
    );
    const tx = await disputeResolutionEngine
      .connect(voter)
      .commitVote(disputeId, toBigNum(lockedTokensAmount), commitHash);
    await tx.wait();
  };

  const revealVote = async (
    disputeId: number,
    votedForGuilty: boolean,
    voter: SignerWithAddress
  ) => {
    const voteSalt = await generateSaltForVote(disputeId, voter);

    const tx = await disputeResolutionEngine
      .connect(voter)
      .revealVote(disputeId, voteSalt, votedForGuilty);
    await tx.wait();
  };

  const increaseBlockTimestamp = async (seconds: number) => {
    await ethers.provider.send("evm_increaseTime", [seconds]);
  };

  const settleDispute = async (disputeId: number) => {
    const tx = await disputeResolutionEngine.settleDispute(disputeId);
    await tx.wait();
  };

  const checkVote = async (
    disputeId: number,
    address: string,
    expectedVote: ExpectedVote
  ) => {
    const vote = await disputeResolutionEngine.getUserVote(address, disputeId);
    expect(vote.lockedTokensAmount).to.be.eql(
      toBigNum(expectedVote.expectedLockedTokensAmount)
    );
    expect(vote.revealedVote).to.eql(expectedVote.expectToBeRevealed);
    expect(vote.votedForGuilty).to.be.eql(expectedVote.expectVotedForGuilty);
  };

  const launchDisputeAndVoteByAllVoters = async () => {
    await createDispute(
      dataProvider.address,
      LOCKED_AMOUNT_FOR_DISPUTE_CREATION
    );

    // Commiting votes
    await commitVote(disputeId, LOCKED_BY_VOTERS[0], true, voters[0]);
    await commitVote(disputeId, LOCKED_BY_VOTERS[1], false, voters[1]);
    await commitVote(disputeId, LOCKED_BY_VOTERS[2], true, voters[2]);

    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);

    // Revealing votes
    await revealVote(disputeId, true, voters[0]);
    await revealVote(disputeId, false, voters[1]);
    await revealVote(disputeId, true, voters[2]);
  };

  const claimRewardAndCheckBalance = async (
    disputeId: number,
    signer: SignerWithAddress,
    expectedReward: number
  ) => {
    const balanceBefore = await token.balanceOf(signer.address);

    // Claim rewards
    const claimTx = await disputeResolutionEngine
      .connect(signer)
      .claimRewardForDispute(disputeId);

    const balanceAfter = await token.balanceOf(signer.address);
    const reward = balanceAfter.sub(balanceBefore);

    expect(reward).to.eql(toBigNum(expectedReward));
  };
});
