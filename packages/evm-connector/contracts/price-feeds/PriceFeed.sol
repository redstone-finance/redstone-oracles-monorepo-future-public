// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceFeed is AggregatorV3Interface {
  address private owner;
  bytes32 public dataFeedId;
  uint256 public dataFeedValue;
  string public descriptionText;

  constructor(
    address owner_,
    bytes32 dataFeedId_,
    string memory _description
  ) {
    dataFeedId = dataFeedId_;
    owner = owner_;
    descriptionText = _description;
  }

  modifier _onlyOwner() {
    require(msg.sender == owner);
    _;
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

  function getRoundData(uint80 _roundId)
    external
    pure
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    revert("Use latestRoundData to get data feed price");
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
    return (uint80(0), int256(dataFeedValue), uint256(0), uint256(0), uint80(0));
  }

  function storeDataFeedValue(uint256 value) external _onlyOwner {
    dataFeedValue = value;
  }
}
