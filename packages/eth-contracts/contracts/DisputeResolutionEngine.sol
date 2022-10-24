// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LockingRegistry.sol";

/**
 * @title DisputeResolutionEngine
 * @dev Implementation of basic dispute resolution protocol
 */
contract DisputeResolutionEngine {
  uint256 constant MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION = 10_000 * 1e18;
  uint256 constant MIN_LOCK_AMOUNT_FOR_VOTING = 5_000 * 1e18;
  uint256 constant PENALTY_AMOUNT = 2_000 * 1e18;
  uint256 constant COMMIT_PERIOD_SECONDS = 4 days;
  uint256 constant REVEAL_PERIOD_SECONDS = 3 days;

  // Note, that lock period for unlocking should be greater
  // than the maximum voting period. Otherwise a guilty provider is able
  // to unlock tokens before the dispute settlement
  uint256 constant UNLOCK_DELAY_SECONDS = 30 days;

  enum DisputeVerdict {
    Unknown,
    Guilty,
    NotGuilty
  }

  struct Vote {
    uint256 lockedTokensAmount;
    bytes32 commitHash;
    bool revealedVote;
    bool votedForGuilty;
    bool claimedReward;
  }

  struct Dispute {
    address creatorAddress;
    address accusedAddress;
    uint256 creationTimestampSeconds;
    string arweaveUrlWithDisputeDetails;
    uint256 revealedForGuiltyAmount;
    uint256 revealedForNotGuiltyAmount;
    uint256 rewardPoolTokensAmount;
    DisputeVerdict verdict;
  }

  IERC20 private _redstoneToken;
  Dispute[] private _disputes;
  mapping(uint256 => mapping(address => Vote)) private _votes; // disputeId => (address => Vote)
  LockingRegistry private _lockingRegistry;

  constructor(address redstoneTokenAddress) {
    _lockingRegistry = new LockingRegistry();
    _lockingRegistry.initialize(redstoneTokenAddress, address(this), UNLOCK_DELAY_SECONDS);
    _redstoneToken = IERC20(redstoneTokenAddress);
  }

  function createDispute(
    address accusedAddress,
    string calldata arweaveUrlWithDisputeDetails,
    uint256 lockedTokensAmount
  ) external {
    require(
      lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION,
      "Insufficient locked tokens amount for dispute creation"
    );

    Dispute storage newDispute = _disputes.push();
    newDispute.creatorAddress = msg.sender;
    newDispute.accusedAddress = accusedAddress;
    newDispute.creationTimestampSeconds = block.timestamp;
    newDispute.arweaveUrlWithDisputeDetails = arweaveUrlWithDisputeDetails;
    newDispute.verdict = DisputeVerdict.Unknown;

    // The code below commented to save gas, because these fields
    // will be set to zero anyway. But we left the commented code
    // to improve the code readability :)
    // newDispute.revealedForGuiltyAmount = 0;
    // newDispute.revealedForNotGuiltyAmount = 0;
    // newDispute.rewardPoolTokensAmount = 0;

    // Dispute creator automatically votes for guilty and their vote is
    // automatically revealed. That's why we pass a zero commit hash here
    uint256 createdDisputeId = _disputes.length - 1;
    _lockTokensAndCreateVote(createdDisputeId, bytes32(0), lockedTokensAmount);
  }

  function commitVote(
    uint256 disputeId,
    uint256 lockedTokensAmount,
    bytes32 commitHash
  ) external {
    Dispute storage dispute = _disputes[disputeId];

    require(
      lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_VOTING,
      "Insufficient locked tokens amount for voting"
    );
    require(
      block.timestamp < dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS,
      "Commit period ended"
    );

    _lockTokensAndCreateVote(disputeId, commitHash, lockedTokensAmount);
  }

  function revealVote(
    uint256 disputeId,
    bytes32 salt,
    bool votedForGuilty
  ) external {
    Dispute storage dispute = _disputes[disputeId];
    Vote storage vote = _votes[disputeId][msg.sender];

    // Checking if the user can reveal their vote
    require(
      block.timestamp > dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS,
      "Reveal period hasn't started yet"
    );
    require(
      block.timestamp <
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Reveal period ended"
    );
    require(vote.lockedTokensAmount > 0, "Cannot find the commited vote to reveal");

    // Verifying commit hash against the revealed vote
    bytes32 expectedCommitHash = calculateHashForVote(disputeId, salt, votedForGuilty);
    require(
      expectedCommitHash == vote.commitHash,
      "Commited hash doesn't match with the revealed vote"
    );

    // Saving user vote details
    vote.revealedVote = true;
    vote.votedForGuilty = votedForGuilty;
    if (votedForGuilty) {
      dispute.revealedForGuiltyAmount += vote.lockedTokensAmount;
    } else {
      dispute.revealedForNotGuiltyAmount += vote.lockedTokensAmount;
    }
  }

  // Anyone can settle a dispute that has not beed settled before
  // when its reveal period ends. Settlement period is not limited in time
  function settleDispute(uint256 disputeId) external {
    Dispute storage dispute = _disputes[disputeId];

    // Checking if the dispute can be settled
    require(dispute.verdict == DisputeVerdict.Unknown, "Dispute has already been settled");
    require(
      block.timestamp >=
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Settlement period hasn't started yet"
    );

    // Setting verdict for the dispute
    if (dispute.revealedForGuiltyAmount > dispute.revealedForNotGuiltyAmount) {
      dispute.verdict = DisputeVerdict.Guilty;

      // Safely slashing lock from the guilty provider
      // And adding it to the dispute reward pool
      uint256 maxSlashableAmount = _lockingRegistry.getMaxSlashableAmount(dispute.accusedAddress);
      if (maxSlashableAmount > 0) {
        uint256 amountToSlash = Math.min(PENALTY_AMOUNT, maxSlashableAmount);
        _lockingRegistry.slash(dispute.accusedAddress, amountToSlash);
        dispute.rewardPoolTokensAmount += amountToSlash;
      }
    } else {
      dispute.verdict = DisputeVerdict.NotGuilty;
    }
  }

  // If a user has won a dispute, they need to manually claim reward
  function claimRewardForDispute(uint256 disputeId) external {
    uint256 rewardForUser = calculatePendingRewardForUser(disputeId, msg.sender);
    _votes[disputeId][msg.sender].claimedReward = true;
    _redstoneToken.transfer(msg.sender, rewardForUser);
  }

  function calculatePendingRewardForUser(uint256 disputeId, address userAddress)
    public
    view
    returns (uint256)
  {
    Dispute storage dispute = _disputes[disputeId];
    Vote storage userVote = _votes[disputeId][userAddress];

    // Checking if the user is elgigble for the reward
    require(dispute.verdict != DisputeVerdict.Unknown, "Dispute has not been settled yet");
    require(userVote.revealedVote, "User didn't reveal vote");
    require(
      userVote.votedForGuilty || dispute.verdict == DisputeVerdict.NotGuilty,
      "User didn't win the dispute"
    );
    require(!userVote.claimedReward, "User already claimed reward for this dispute");

    // Calculaing reward amount for the user
    uint256 totalLockedTokenOfAllWinners = Math.max(
      dispute.revealedForGuiltyAmount,
      dispute.revealedForNotGuiltyAmount
    );
    uint256 userRewardAmount = (dispute.rewardPoolTokensAmount * userVote.lockedTokensAmount) /
      totalLockedTokenOfAllWinners;

    return userRewardAmount;
  }

  // We strongly recommend voters to calculate salt off-chain using the
  // pseudo-algorithm below. It is not required by this smart contract,
  // but will allow users to unambiguously recover it for vote revealing
  // Note: `signMessage` function must produce deterministic signatures
  // const seedMessage = toUtf8Bytes(disputeId + "REDSTONE_DISPUTE_SALT");
  // const signature = await signer.signMessage(seedMessage);
  // const salt = keccak256(signature);
  // return salt;
  function calculateHashForVote(
    uint256 disputeId,
    bytes32 salt,
    bool votedForGuilty
  ) public pure returns (bytes32) {
    return keccak256(abi.encode(disputeId, salt, votedForGuilty, "Redstone dispute"));
  }

  function getDisputesCount() public view returns (uint256) {
    return _disputes.length;
  }

  function getDisputeDetails(uint256 disputeId) public view returns (Dispute memory) {
    return _disputes[disputeId];
  }

  function getUserVote(address user, uint256 disputeId) public view returns (Vote memory) {
    return _votes[disputeId][user];
  }

  function getLockingRegistryAddress() public view returns (address) {
    return address(_lockingRegistry);
  }

  function _lockTokensAndCreateVote(
    uint256 disputeId,
    bytes32 commitHash,
    uint256 lockedTokensAmount
  ) private {
    Dispute storage dispute = _disputes[disputeId];
    require(
      _votes[disputeId][msg.sender].lockedTokensAmount == 0,
      "Already locked some tokens for this dispute"
    );
    require(lockedTokensAmount > 0, "Amount of locked tokens should be greater than 0");

    // Locking tokens on this contract. It will fail if user hasn't approved
    // tokens spending by this contract
    _redstoneToken.transferFrom(msg.sender, address(this), lockedTokensAmount);

    // Saving a new vote
    _votes[disputeId][msg.sender] = Vote({
      lockedTokensAmount: lockedTokensAmount,
      commitHash: commitHash,
      revealedVote: false,
      votedForGuilty: false,
      claimedReward: false
    });

    // Automatically reveal the vote created by the dispute creator
    if (dispute.creatorAddress == msg.sender) {
      Vote storage createdVote = _votes[disputeId][msg.sender];
      createdVote.revealedVote = true;
      createdVote.votedForGuilty = true;
      dispute.revealedForGuiltyAmount += lockedTokensAmount;
    }

    // Increasing reward pool for the dispute
    dispute.rewardPoolTokensAmount += lockedTokensAmount;
  }
}
