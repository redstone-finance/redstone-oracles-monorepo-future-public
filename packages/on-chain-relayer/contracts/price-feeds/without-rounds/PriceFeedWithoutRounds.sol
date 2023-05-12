// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../PriceFeedBase.sol";

abstract contract PriceFeedWithoutRounds is PriceFeedBase {
  error GetRoundDataCanBeOnlyCalledWithLatestRound(uint80 requestedRoundId);

  // There are possible use cases that some contracts don't need values from old rounds
  // but still rely on `getRoundData` or `latestRounud` functions
  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    if (requestedRoundId != latestRound()) {
      revert GetRoundDataCanBeOnlyCalledWithLatestRound(requestedRoundId);
    }
    return latestRoundData();
  }
}
