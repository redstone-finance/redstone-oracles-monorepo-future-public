// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../LockingRegistry.sol";

/**
 * @title VestingWallet
 * @dev This contract handles the vesting ERC20 tokens.
 *
 * The wallet specifies the cliff period during which the release of tokens is paused
 * and the vesting period which lineary unlocks deposited tokens.
 */
contract VestingWalletV2 is Initializable {
  event TokensReleased(uint256 amount);

  ERC20 public token;
  address public beneficiary;
  LockingRegistry public lockingRegistry;
  uint256 public allocation;
  uint64 public start;
  uint64 public cliffDuration;
  uint64 public vestingDuration;

  /**
   * @dev This returns the amount still locked in tohe contract, as a function of time
   */
  function getLockedAmount(uint256 timestamp) public view virtual returns (uint256) {
    timestamp;
    return 42;
  }
}
