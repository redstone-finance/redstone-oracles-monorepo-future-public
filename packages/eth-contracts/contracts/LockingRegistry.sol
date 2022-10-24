// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title LockingRegistry
 * @dev Contract for managing the locked tokens of RedStone data providers
 */
contract LockingRegistry is Initializable {
  struct UserLockingDetails {
    uint256 lockedAmount;
    uint256 pendingAmountToUnlock;
    uint256 unlockOpeningTimestampSeconds;
  }

  event UnlockRequested(address user, UserLockingDetails lockingDetails);
  event UnlockCompleted(address user, UserLockingDetails lockingDetails);

  uint256 private _delayForUnlockingInSeconds;
  IERC20 private _lockedToken;
  address private _authorisedSlasher;
  mapping(address => UserLockingDetails) private _lockingDetailsForUsers;

  function initialize(
    address lockedTokenAddress,
    address authorisedSlasher,
    uint256 delayForUnlockingInSeconds
  ) public initializer {
    _lockedToken = IERC20(lockedTokenAddress);
    _authorisedSlasher = authorisedSlasher;
    _delayForUnlockingInSeconds = delayForUnlockingInSeconds;
  }

  // Before calling this function tx sender should allow spending
  // the locking amount by this contract
  function lock(uint256 amountToLock) external {
    require(_lockedToken.transferFrom(msg.sender, address(this), amountToLock), "Transfer failed");
    _lockingDetailsForUsers[msg.sender].lockedAmount += amountToLock;
  }

  function requestUnlock(uint256 amountToUnlock) external {
    UserLockingDetails storage userLockingDetails = _lockingDetailsForUsers[msg.sender];
    require(amountToUnlock > 0, "Amount to unlock must be a positive number");
    require(
      userLockingDetails.lockedAmount >= amountToUnlock,
      "Can not request to unlock more than locked"
    );

    userLockingDetails.pendingAmountToUnlock = amountToUnlock;
    userLockingDetails.unlockOpeningTimestampSeconds =
      block.timestamp +
      _delayForUnlockingInSeconds;

    emit UnlockRequested(msg.sender, userLockingDetails);
  }

  function completeUnlock() external {
    UserLockingDetails storage userLockingDetails = _lockingDetailsForUsers[msg.sender];
    uint256 amountToUnlock = userLockingDetails.pendingAmountToUnlock;

    require(
      block.timestamp > userLockingDetails.unlockOpeningTimestampSeconds,
      "Unlocking is not opened yet"
    );
    require(amountToUnlock > 0, "User hasn't requested unlock before");
    require(amountToUnlock <= userLockingDetails.lockedAmount, "Can not unlock more than locked");

    userLockingDetails.lockedAmount -= amountToUnlock;
    userLockingDetails.pendingAmountToUnlock = 0;
    require(_lockedToken.transfer(msg.sender, amountToUnlock), "Transfer failed");

    emit UnlockCompleted(msg.sender, userLockingDetails);
  }

  function getUserLockingDetails(address addr) public view returns (UserLockingDetails memory) {
    return _lockingDetailsForUsers[addr];
  }

  function getMaxSlashableAmount(address addr) public view returns (uint256) {
    return _lockingDetailsForUsers[addr].lockedAmount;
  }

  function slash(address slashedAddress, uint256 slashedAmount) public onlyAuthorisedSlasher {
    UserLockingDetails storage userLockingDetails = _lockingDetailsForUsers[slashedAddress];

    require(
      userLockingDetails.lockedAmount >= slashedAmount,
      "Locked balance is lower than the requested slashed amount"
    );

    userLockingDetails.lockedAmount -= slashedAmount;
    require(_lockedToken.transfer(msg.sender, slashedAmount), "Transfer failed");
  }

  modifier onlyAuthorisedSlasher() {
    require(msg.sender == _authorisedSlasher, "Tx sender is not authorised to slash locks");
    _;
  }
}
