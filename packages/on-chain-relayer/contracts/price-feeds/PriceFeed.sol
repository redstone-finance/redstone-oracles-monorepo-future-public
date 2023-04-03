// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceFeedsAdapter.sol";

contract PriceFeed is AggregatorV3Interface {
  PriceFeedsAdapter private priceFeedsAdapter;
  bytes32 public dataFeedId;
  string public descriptionText;

  constructor(
    PriceFeedsAdapter priceFeedsAdapter_,
    bytes32 dataFeedId_,
    string memory description_
  ) {
    priceFeedsAdapter = priceFeedsAdapter_;
    dataFeedId = dataFeedId_;
    descriptionText = description_;
  }

  function getDataFeedId() external view returns (bytes32) {
    return dataFeedId;
  }

  function decimals() external pure override returns (uint8) {
    return 8;
  }

  function description() external view override returns (string memory) {
    return descriptionText;
  }

  function version() external pure override returns (uint256) {
    return 1;
  }

  function getRoundData(
    uint80 requestedRoundId
  )
    external
    view
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    (uint256 dataFeedValue, uint256 roundTimestampInMilliseconds) = priceFeedsAdapter.getRoundData(
      dataFeedId,
      requestedRoundId
    );
    roundId = requestedRoundId;
    answer = int256(dataFeedValue);
    startedAt = roundTimestampInMilliseconds / 1000;
    updatedAt = startedAt;
    answeredInRound = requestedRoundId;
  }

  function latestRoundData()
    external
    view
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    (
      uint256 dataFeedValue,
      uint256 roundId_,
      uint256 lastUpdateTimestampMilliseconds
    ) = priceFeedsAdapter.getValueForDataFeedAndLastRoundParams(dataFeedId);
    return (
      uint80(roundId_),
      int256(dataFeedValue),
      uint256(lastUpdateTimestampMilliseconds),
      uint256(block.timestamp),
      uint80(roundId_)
    );
  }

  // Below are methods that are not part of the AggregatorV3Interface,
  // but are still used by some projects integrated with Chainlink (e.g. GMX)

  function latestRound() external view returns (uint80) {
    return uint80(priceFeedsAdapter.getLastRound());
  }

  function latestAnswer() external view returns (int256) {
    return int256(priceFeedsAdapter.getValueForDataFeed(dataFeedId));
  }
}
