// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title LockingRegistry
 * @dev Contract for managing the locked tokens of RedStone data providers
 */
contract LockingRegistryV2 is Initializable {
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
  function lock(uint256 lockingAmount) external pure {
    lockingAmount;
    revert("Disabled in V2");
  }

  function newFunction() public pure returns (uint256) {
    return 42;
  }
}
