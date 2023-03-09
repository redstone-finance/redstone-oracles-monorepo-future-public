// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceFeedsAdapter.sol";
import "./CustomErrors.sol";

contract PriceFeed is AggregatorV3Interface {
  address private priceFeedsAdapterAddress;
  bytes32 public dataFeedId;
  string public descriptionText;

  constructor(
    address priceFeedsAdapterAddress_,
    bytes32 dataFeedId_,
    string memory description_
  ) {
    priceFeedsAdapterAddress = priceFeedsAdapterAddress_;
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
    uint80 /* _roundId */
  )
    external
    pure
    override
    returns (
      uint80, /* roundId */
      int256, /* answer */
      uint256, /* startedAt */
      uint256, /* updatedAt */
      uint80 /* answeredInRound */
    )
  {
    revert CustomErrors.UseLatestRoundToGetDataFeedPrice();
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
    ) = PriceFeedsAdapter(priceFeedsAdapterAddress).getValueForDataFeedAndLastRoundParams(
        dataFeedId
      );
    return (
      uint80(roundId_),
      int256(dataFeedValue),
      uint256(lastUpdateTimestampMilliseconds),
      uint256(block.timestamp),
      uint80(roundId_)
    );
  }
}
