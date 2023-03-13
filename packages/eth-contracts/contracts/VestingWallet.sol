// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
  event TokensRelease(uint256 amount);

  IERC20 public token;
  address public beneficiary;
  LockingRegistry public lockingRegistry;
  uint256 public allocation;
  uint64 public start;
  uint64 public cliffDuration;
  uint64 public vestingDuration;

  function initialize(
    IERC20 vestingToken_,
    address beneficiaryAddress_,
    LockingRegistry lockingRegistry_,
    uint256 allocation_,
    uint64 startTimestamp_,
    uint64 cliffDurationSeconds_,
    uint64 vestingDurationSeconds_
  ) public initializer {
    require(address(vestingToken_) != address(0), "VestingWallet: vesting token is zero address");
    require(beneficiaryAddress_ != address(0), "VestingWallet: beneficiary is zero address");
    require(allocation_ > 0, "VestingWallet: allocation is zero");

    token = vestingToken_;
    beneficiary = beneficiaryAddress_;
    lockingRegistry = LockingRegistry(lockingRegistry_);
    allocation = allocation_;
    start = startTimestamp_;
    cliffDuration = cliffDurationSeconds_;
    vestingDuration = vestingDurationSeconds_;
  }

  /**
   * @dev This returns the amount still unvested in the contract, as a function of time
   */
  function getUnvestedAmount(uint256 timestamp) public view virtual returns (uint256) {
    if (timestamp <= start + cliffDuration) {
      return allocation;
    } else if (timestamp > start + cliffDuration + vestingDuration) {
      return 0;
    } else {
      uint256 elapsedTime = start + cliffDuration + vestingDuration - timestamp;
      return (allocation * elapsedTime) / vestingDuration;
    }
  }

  /**
   * @dev Getter for the amount of releasable tokens.
   */
  function getReleasable() public view virtual returns (uint256) {
    uint256 unvestedAmount = getUnvestedAmount(block.timestamp);
    return
      token.balanceOf(address(this)) < unvestedAmount
        ? 0
        : token.balanceOf(address(this)) - unvestedAmount;
  }

  /**
   * @dev Release the tokens that have already vested.
   *
   * Emits a {TokensReleased} event.
   */
  function release(uint256 amount) public virtual onlyBeneficiary {
    uint256 available = getReleasable();
    require(available >= amount, "VestingWallet: there is not enough tokens to release");

    require(token.transfer(beneficiary, amount));
    emit TokensRelease(amount);
  }

  function lock(uint256 amount) external onlyBeneficiary {
    require(
      token.balanceOf(address(this)) >= amount,
      "VestingWallet: there is not enough tokens to lock"
    );
    require(token.approve(address(lockingRegistry), amount), "Approval failed");
    lockingRegistry.lock(amount);
  }

  function requestUnlock(uint256 amount) external onlyBeneficiary {
    lockingRegistry.requestUnlock(amount);
  }

  function completeUnlock() external onlyBeneficiary {
    lockingRegistry.completeUnlock();
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "VestingWallet: only beneficiary can call this function");
    _;
  }
}
