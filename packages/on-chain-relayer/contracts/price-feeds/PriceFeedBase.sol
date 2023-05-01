// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../core/IRedstoneAdapter.sol";
import "./interfaces/IPriceFeed.sol";

abstract contract PriceFeedBase is IPriceFeed, Initializable {
  function initialize() public initializer {}

  function getDataFeedId() public view virtual returns (bytes32) {
    return bytes32(0);
  }

  function getPriceFeedAdapter() public view virtual returns (IRedstoneAdapter);

  function decimals() public pure override returns (uint8) {
    return 8;
  }

  function description() public view virtual override returns (string memory) {
    return "Redstone Price Feed";
  }

  function version() public pure override returns (uint256) {
    return 1;
  }

  function latestRoundData() public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    roundId = latestRound();
    answer = latestAnswer();

    (uint128 dataTimestamp, uint128 blockTimestamp) = getPriceFeedAdapter()
      .getTimestampsFromLatestUpdate();

    startedAt = dataTimestamp / 1000; // convert to seconds
    updatedAt = blockTimestamp;
    answeredInRound = roundId;
  }

  function latestAnswer() public view returns (int256) {
    bytes32 dataFeedId = getDataFeedId();
    return int256(getPriceFeedAdapter().getValueForDataFeed(dataFeedId));
  }

  function latestRound() public view virtual returns (uint80) {
    return 0;
  }
}
