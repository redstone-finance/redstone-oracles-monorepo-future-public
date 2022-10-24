// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./LockingRegistry.sol";

/**
 * @title VestingWallet
 * @dev This contract handles the vesting ERC20 tokens.
 *
 * The wallet specifies the cliff period during which the release of tokens is paused
 * and the vesting period which lineary unlocks deposited tokens.
 */
contract VestingWallet is Initializable {
  event TokensReleased(uint256 amount);

  ERC20 public token;
  address public beneficiary;
  LockingRegistry public lockingRegistry;
  uint256 public allocation;
  uint64 public start;
  uint64 public cliffDuration;
  uint64 public vestingDuration;

  function initialize(
    address vestingToken_,
    address beneficiaryAddress_,
    address lockingRegistry_,
    uint256 allocation_,
    uint64 startTimestamp_,
    uint64 cliffDurationSeconds_,
    uint64 vestingDurationSeconds_
  ) public initializer {
    require(vestingToken_ != address(0), "VestingWallet: vesting token is zero address");
    require(beneficiaryAddress_ != address(0), "VestingWallet: beneficiary is zero address");
    require(allocation_ > 0, "VestingWallet: allocation is zero");

    token = ERC20(vestingToken_);
    beneficiary = beneficiaryAddress_;
    lockingRegistry = LockingRegistry(lockingRegistry_);
    allocation = allocation_;
    start = startTimestamp_;
    cliffDuration = cliffDurationSeconds_;
    vestingDuration = vestingDurationSeconds_;
  }

  /**
   * @dev This returns the amount still locked in tohe contract, as a function of time
   */
  function getLockedAmount(uint256 timestamp) public view virtual returns (uint256) {
    if (timestamp < start + cliffDuration) {
      return allocation;
    } else if (timestamp > start + cliffDuration + vestingDuration) {
      return 0;
    } else {
      return
        (allocation * (start + cliffDuration + vestingDuration - timestamp)) / vestingDuration;
    }
  }

  /**
   * @dev Getter for the amount of releasable tokens.
   */
  function getReleasable() public view virtual returns (uint256) {
    return
      token.balanceOf(address(this)) < getLockedAmount(block.timestamp)
        ? 0
        : token.balanceOf(address(this)) - getLockedAmount(block.timestamp);
  }

  /**
   * @dev Release the tokens that have already vested.
   *
   * Emits a {TokensReleased} event.
   */
  function release(uint256 amount) public virtual {
    uint256 available = getReleasable();
    require(available >= amount, "VestingWallet: there is not enough tokens to release");

    require(token.transfer(beneficiary, amount));
    emit TokensReleased(amount);
  }

  function lock(uint256 amount) external {
    require(
      token.balanceOf(address(this)) >= amount,
      "VestingWallet: there is not enough tokens to lock"
    );
    token.approve(address(lockingRegistry), amount);
    lockingRegistry.lock(amount);
  }

  function requestUnlock(uint256 amount) external {
    lockingRegistry.requestUnlock(amount);
  }

  function completeUnlock() external {
    lockingRegistry.completeUnlock();
  }
}
