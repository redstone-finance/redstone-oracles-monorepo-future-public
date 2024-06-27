// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

interface IMultiFeedAdapter {
  function updateDataFeedsValuesPartial(bytes32[] memory dataFeedsIds) external;

  function getLastUpdateDetails(bytes32 dataFeedId) external view returns (uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue);

  function getLastUpdateDetailsUnsafe(bytes32 dataFeedId) external view returns (uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue);

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) external view returns (uint256[] memory values);

  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256 dataFeedValue);

  function getDataTimestampFromLatestUpdate(bytes32 dataFeedId) external view returns (uint256 lastDataTimestamp);

  function getBlockTimestampFromLatestUpdate(bytes32 dataFeedId) external view returns (uint256 blockTimestamp);
}
