// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "./PriceFeedsAdapterWithRounds.sol";
import "../PriceFeedBase.sol";

abstract contract PriceFeedWithRounds is PriceFeedBase {
  function getPriceFeedAdapterWithRounds() public view returns(PriceFeedsAdapterWithRounds) {
    return PriceFeedsAdapterWithRounds(address(getPriceFeedAdapter()));
  }

  function latestRound() public view override returns (uint80) {
    return uint80(getPriceFeedAdapterWithRounds().getLatestRoundId());
  }

  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    (uint256 dataFeedValue, uint128 roundDataTimestamp, uint128 roundBlockTimestamp) = getPriceFeedAdapterWithRounds().getRoundData(
      getDataFeedId(),
      requestedRoundId
    );
    roundId = requestedRoundId;
    answer = int256(dataFeedValue);
    startedAt = roundDataTimestamp / 1000; // convert to seconds
    updatedAt = roundBlockTimestamp;
    answeredInRound = requestedRoundId;
  }
}
