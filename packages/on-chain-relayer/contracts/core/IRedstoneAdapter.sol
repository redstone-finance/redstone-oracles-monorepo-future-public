// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

/**
 * @title Interface of RedStone adapter
 * @author The Redstone Oracles team
 */
interface IRedstoneAdapter {

  /**
   * @notice Updates values of all data feeds supported by the Adapter contract
   * @dev This function requires an attached redstone payload to the transaction calldata.
   * It also requires each data package to have exactly the same timestamp
   * @param dataPackagesTimestamp Timestamp of each signed data package in the redstone payload
   */
  function updateDataFeedsValues(uint256 dataPackagesTimestamp) external;


  /**
   * @notice Returns the latest properly reported value of the data feed
   * @param dataFeedId The identifier of the requested data feed
   * @return value The latest value of the given data feed
   */
  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256);

  /**
   * @notice Returns the latest properly reported values for several data feeds
   * @param requestedDataFeedIds The array of identifiers for the requested feeds
   * @return values Values of the requested data feeds in the corresponding order
   */
  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) external view returns (uint256[] memory);

  /**
   * @notice Returns data timestamp from the latest update
   * @dev It's virtual, because its implementation can sometimes be different
   * (e.g. SinglePriceFeedAdapterWithClearing)
   * @return lastDataTimestamp Timestamp of the latest reported data packages
   */
  function getDataTimestampFromLatestUpdate() external view returns (uint256 lastDataTimestamp);

  /**
   * @notice Returns block timestamp of the latest successful update
   * @return blockTimestamp The block timestamp of the latest successful update
   */
  function getBlockTimestampFromLatestUpdate() external view returns (uint256 blockTimestamp);


  /**
   * @notice Returns timestamps of the latest successful update
   * @return dataTimestamp timestamp (usually in milliseconds) from the signed data packages
   * @return blockTimestamp timestamp of the block when the update has happened
   */
  function getTimestampsFromLatestUpdate() external view returns (uint128 dataTimestamp, uint128 blockTimestamp);

  /**
   * @notice Returns identifiers of all data feeds supported by the Adapter contract
   * @return An array of data feed identifiers
   */
  function getDataFeedIds() external view returns (bytes32[] memory);

  /**
   * @notice Returns the unique index of the given data feed
   * @param dataFeedId The data feed identifier
   * @return index The index of the data feed
   */
  function getDataFeedIndex(bytes32 dataFeedId) external view returns (uint256);

  /**
   * @notice Returns minimal required interval (usually in seconds) between subsequent updates
   * @return interval The required interval between updates
   */
  function getMinIntervalBetweenUpdates() external view returns (uint256);

  /**
   * @notice Reverts if the proposed timestamp of data packages it too old or too new
   * comparing to the block.timestamp. It also ensures that the proposed timestamp is newer
   * Then the one from the previous update
   * @param dataPackagesTimestamp The proposed timestamp (usually in milliseconds)
   */
  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp) external view;

  /**
   * @notice Reverts if the updater is not authorised
   * @dev This function should revert if msg.sender is not allowed to update data feed values
   * @param updater The address of the proposed updater
   */
  function requireAuthorisedUpdater(address updater) external view;
}
