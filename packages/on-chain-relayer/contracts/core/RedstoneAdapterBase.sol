// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import "./IRedstoneAdapter.sol";

/**
 * @title Core logic of RedStone Adapter Contract
 * @author The Redstone Oracles team
 * @dev This contract is used to repeatedly push RedStone data to blockchain storage
 * More details here: https://docs.redstone.finance/docs/smart-contract-devs/get-started/redstone-classic
 *
 * Key details about the contract:
 * - Values for data feeds can be updated using the `updateDataFeedsValues` function
 * - All data feeds must be updated within a single call, partial updates are not allowed
 * - There is a configurable minimum interval between updates
 * - Updaters can be restricted by overriding `requireAuthorisedUpdater` function
 * - The contract is designed to force values validation, by default it prevents returning zero values
 * - All data packages in redstone payload must have the same timestamp,
 *    equal to `dataPackagesTimestamp` argument of the `updateDataFeedsValues` function
 */
abstract contract RedstoneAdapterBase is RedstoneConsumerNumericBase, IRedstoneAdapter {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 internal constant LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION = 0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");
  uint256 internal constant MIN_INTERVAL_BETWEEN_UPDATES = 3 seconds;
  uint256 internal constant BITS_COUNT_IN_16_BYTES = 128;

  error DataTimestampShouldBeNewerThanBefore(
    uint256 receivedDataTimestampMilliseconds,
    uint256 lastDataTimestampMilliseconds
  );

  error MinIntervalBetweenUpdatesHasNotPassedYet(
    uint256 currentBlockTimestamp,
    uint256 lastUpdateTimestamp,
    uint256 minIntervalBetweenUpdates
  );

  error DataPackageTimestampMismatch(uint256 expectedDataTimestamp, uint256 dataPackageTimestamp);

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);

  error DataFeedIdNotFound(bytes32 dataFeedId);

  // This function should throw if msg.sender is not allowed to update data feed values
  // By default, anyone can update data feed values, but it can be overridden
  function requireAuthorisedUpdater(address updater) public view virtual {}

  function getDataFeedIds() public view virtual returns (bytes32[] memory) {
    return new bytes32[](0);
  }

  // This function can be overriden to reduce gas costs
  function getDataFeedIndex(bytes32 dataFeedId) public view virtual returns (uint256) {
    bytes32[] memory dataFeedIds = getDataFeedIds();
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      if (dataFeedIds[i] == dataFeedId) {
        return i;
      }
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  // This function requires redstone payload attached to the tx calldata
  function updateDataFeedsValues(uint256 dataPackagesTimestamp) public {
    requireAuthorisedUpdater(msg.sender);
    _assertMinIntervalBetweenUpdatesPassed();
    validateProposedDataPackagesTimestamp(dataPackagesTimestamp);
    _saveTimestampsOfCurrentUpdate(dataPackagesTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedIds();

    // It will trigger timestamp validation for each data package
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    validateAndUpdateDataFeedsValues(dataFeedsIdsArray, oracleValues);
  }

  // Note! This function is not called directly, it's called for each data package
  // in redstone payload and just verifies if each data package has the same timestamp
  // as the one that was saved in storage
  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    // It means that we are in the special view context and we can skip validation of the
    // timestamp. It can be useful for calling view functions, as they can not modify the contract
    // state to pass the timestamp validation below
    if (msg.sender == address(0)) {
      return;
    }

    uint256 expectedDataPackageTimestamp = getDataTimestampFromLatestUpdate();
    if (receivedTimestampMilliseconds != expectedDataPackageTimestamp) {
      revert DataPackageTimestampMismatch(
        expectedDataPackageTimestamp,
        receivedTimestampMilliseconds
      );
    }
  }

  function validateAndUpdateDataFeedsValues(bytes32[] memory dataFeedIdsArray, uint256[] memory values) internal virtual;

  function _assertMinIntervalBetweenUpdatesPassed() private view {
    uint256 currentBlockTimestamp = block.timestamp;
    uint256 blockTimestampFromLatestUpdate = getBlockTimestampFromLatestUpdate();
    uint256 minIntervalBetweenUpdates = getMinIntervalBetweenUpdates();
    if (currentBlockTimestamp < blockTimestampFromLatestUpdate + minIntervalBetweenUpdates) {
      revert MinIntervalBetweenUpdatesHasNotPassedYet(
        currentBlockTimestamp,
        blockTimestampFromLatestUpdate,
        minIntervalBetweenUpdates
      );
    }
  }

  // You can override this function to change the required interval between udpates
  // Avoid setting it to 0, as it may open many attack vectors
  function getMinIntervalBetweenUpdates() public view virtual returns (uint256) {
    return MIN_INTERVAL_BETWEEN_UPDATES;
  }

  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp) public view {
    preventUpdateWithOlderDataPackages(dataPackagesTimestamp);
    validateDataPackagesTimestampOnce(dataPackagesTimestamp);
  }

  function validateDataPackagesTimestampOnce(uint256 dataPackagesTimestamp) public view virtual {
    uint256 receivedTimestampSeconds = dataPackagesTimestamp / 1000;

    (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) = getAllowedTimestampDiffsInSeconds();

    if (block.timestamp < receivedTimestampSeconds) {
      if ((receivedTimestampSeconds - block.timestamp) > maxDataAheadSeconds) {
        revert RedstoneDefaultsLib.TimestampFromTooLongFuture(receivedTimestampSeconds, block.timestamp);
      }
    } else if ((block.timestamp - receivedTimestampSeconds) > maxDataDelaySeconds) {
      revert RedstoneDefaultsLib.TimestampIsTooOld(receivedTimestampSeconds, block.timestamp);
    }
  }

  function getAllowedTimestampDiffsInSeconds() public view virtual returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_SECONDS;
    maxDataDelaySeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_DELAY_SECONDS;
  }

  function preventUpdateWithOlderDataPackages(uint256 dataPackagesTimestamp) internal view {
    uint256 dataTimestampFromLatestUpdate = getDataTimestampFromLatestUpdate();

    if (dataPackagesTimestamp <= dataTimestampFromLatestUpdate) {
      revert DataTimestampShouldBeNewerThanBefore(
        dataPackagesTimestamp,
        dataTimestampFromLatestUpdate
      );
    }
  }

  function getDataTimestampFromLatestUpdate() public view virtual returns (uint256 lastDataTimestamp) {
    (lastDataTimestamp, ) = getTimestampsFromLatestUpdate();
  }

  function getBlockTimestampFromLatestUpdate() public view returns (uint256 blockTimestamp) {
    (, blockTimestamp) = getTimestampsFromLatestUpdate();
  }

  function getPackedTimestampsFromLatestUpdate() public view returns (uint256 packedTimestamps) {
    assembly {
      packedTimestamps := sload(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION)
    }
  }

  function getTimestampsFromLatestUpdate() public view virtual returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    return _unpackTimestamps(getPackedTimestampsFromLatestUpdate());
  }

  function _unpackTimestamps(uint256 packedTimestamps) internal pure returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    dataTimestamp = uint128(packedTimestamps >> 128); // first 128 bits
    blockTimestamp = uint128(packedTimestamps); // last 128 bits
  }

  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) internal virtual {
    uint256 blockTimestamp = block.timestamp;
    assembly {
      let timestamps := packTwoNumbers(dataPackagesTimestamp, blockTimestamp)
      sstore(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION, timestamps)

      function packTwoNumbers(num1, num2) -> resultNumber {
        resultNumber := or(shl(BITS_COUNT_IN_16_BYTES, num1), num2)
      }
    }
  }

  function getValueForDataFeed(bytes32 dataFeedId) public view returns (uint256) {
    getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported
    uint256 valueForDataFeed = getValueForDataFeedUnsafe(dataFeedId);
    validateDataFeedValue(dataFeedId, valueForDataFeed);
    return valueForDataFeed;
  }

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory values = getValuesForDataFeedUnsafe(requestedDataFeedIds);
    for (uint256 i = 0; i < requestedDataFeedIds.length; i++) {
      bytes32 dataFeedId = requestedDataFeedIds[i];
      getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported
      validateDataFeedValue(dataFeedId, values[i]);
    }
    return values;
  }

  function validateDataFeedValue(bytes32 dataFeedId, uint256 valueForDataFeed) public pure virtual {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }

  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view virtual returns (uint256);

  function getValuesForDataFeedUnsafe(bytes32[] memory requestedDataFeedIds) public view virtual returns (uint256[] memory values) {
    values = new uint256[](requestedDataFeedIds.length);
    for (uint256 i = 0; i < requestedDataFeedIds.length; i++) {
      values[i] = getValueForDataFeedUnsafe(requestedDataFeedIds[i]);
    }
    return values;
  }
}
