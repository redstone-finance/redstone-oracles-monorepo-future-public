// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

interface IRedstoneAdapter {
  function updateDataFeedsValues(uint256 proposedTimestamp) external;

  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256);

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) external view returns (uint256[] memory);

  function getTimestampsFromLatestUpdate() external view returns (uint128 dataTimestamp, uint128 blockTimestamp);

  function getDataFeedIds() external view returns (bytes32[] memory);

  function getDataFeedIndex(bytes32 dataFeedId) external view returns (uint256);

  function getMinIntervalBetweenUpdates() external view returns (uint256);

  function validateProposedDataPackagesTimestamp(uint256 proposedDataTimestamp) external view;

  function requireAuthorisedUpdater(address updater) external view;
}
