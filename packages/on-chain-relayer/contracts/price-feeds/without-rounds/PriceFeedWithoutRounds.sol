// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {PriceFeedBase} from "../PriceFeedBase.sol";

/**
 * @title Implementation of a price feed contract without rounds support
 * @author The Redstone Oracles team
 * @dev This contract is abstract. The actual contract instance
 * must implement the following functions:
 * - getDataFeedId
 * - getPriceFeedAdapter
 */
abstract contract PriceFeedWithoutRounds is PriceFeedBase {
  uint80 constant DEFAULT_ROUND = 1;

  error GetRoundDataCanBeOnlyCalledWithLatestRound(uint80 requestedRoundId);

  /**
   * @dev We always return 1, since we do not support rounds in this contract
   */
  function latestRound() public pure override returns (uint80) {
    return DEFAULT_ROUND;
  }
  
  /**
   * @dev There are possible use cases that some contracts don't need values from old rounds
   * but still rely on `getRoundData` or `latestRounud` functions
   */
  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    if (requestedRoundId != latestRound()) {
      revert GetRoundDataCanBeOnlyCalledWithLatestRound(requestedRoundId);
    }
    return latestRoundData();
  }
}
