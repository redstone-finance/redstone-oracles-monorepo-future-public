// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {RedstoneConsumerNumericBase, RedstoneDefaultsLib} from "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import {IRedstoneAdapter} from "./IRedstoneAdapter.sol";

/**
 * @title Core logic of Redstone Adapter Contract
 * @author The Redstone Oracles team
 * @dev This contract is used to repeatedly push Redstone data to blockchain storage
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
 * - Block timestamp abstraction - even though we call it blockTimestamp in many places,
 *    it's possible to have a custom logic here, e.g. use block number instead of a timestamp
 */
abstract contract RedstoneAdapterBase is RedstoneConsumerNumericBase, IRedstoneAdapter {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 internal constant LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION = 0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");
  uint256 internal constant MIN_INTERVAL_BETWEEN_UPDATES = 3 seconds;
  uint256 internal constant BITS_COUNT_IN_16_BYTES = 128;
  uint256 internal constant MAX_NUMBER_FOR_128_BITS = 0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff;

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

  error DataTimestampIsTooBig(uint256 dataTimestamp);

  error BlockTimestampIsTooBig(uint256 blockTimestamp);

  /**
   * @notice Reverts if the updater is not authorised
   * @dev This function should revert if msg.sender is not allowed to update data feed values
   * @param updater The address of the proposed updater
   */
  function requireAuthorisedUpdater(address updater) public view virtual {
    // By default, anyone can update data feed values, but it can be overridden
  }

  /**
   * @notice Returns identifiers of all data feeds supported by the Adapter contract
   * @dev this function must be implemented in derived contracts
   * @return An array of data feed identifiers
   */
  function getDataFeedIds() public view virtual returns (bytes32[] memory);

  /**
   * @notice Returns the unique index of the given data feed
   * @dev This function can (and should) be overriden to reduce gas
   * costs of other functions
   * @param dataFeedId The data feed identifier
   * @return index The index of the data feed
   */
  function getDataFeedIndex(bytes32 dataFeedId) public view virtual returns (uint256) {
    bytes32[] memory dataFeedIds = getDataFeedIds();
    for (uint256 i = 0; i < dataFeedIds.length;) {
      if (dataFeedIds[i] == dataFeedId) {
        return i;
      }
      unchecked { i++; } // reduces gas costs
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  /**
   * @notice Updates values of all data feeds supported by the Adapter contract
   * @dev This function requires an attached redstone payload to the transaction calldata.
   * It also requires each data package to have exactly the same timestamp
   * @param dataPackagesTimestamp Timestamp of each signed data package in the redstone payload
   */
  function updateDataFeedsValues(uint256 dataPackagesTimestamp) public virtual {
    requireAuthorisedUpdater(msg.sender);
    _assertMinIntervalBetweenUpdatesPassed();
    validateProposedDataPackagesTimestamp(dataPackagesTimestamp);
    _saveTimestampsOfCurrentUpdate(dataPackagesTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedIds();

    // It will trigger timestamp validation for each data package
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    _validateAndUpdateDataFeedsValues(dataFeedsIdsArray, oracleValues);
  }

  /**
   * @dev Note! This function is not called directly, it's called for each data package    .
   * in redstone payload and just verifies if each data package has the same timestamp
   * as the one that was saved in the storage
   * @param receivedTimestampMilliseconds Timestamp from a data package
   */
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

  /**
   * @dev This function should be implemented by the actual contract
   * and should contain the logic of values validation and reporting.
   * Usually, values reporting is based on saving them to the contract storage,
   * e.g. in PriceFeedsAdapter, but some custom implementations (e.g. GMX keeper adapter
   * or Mento Sorted Oracles adapter) may handle values updating in a different way
   * @param dataFeedIdsArray Array of the data feeds identifiers (it will always be all data feed ids)
   * @param values The reported values that should be validated and reported
   */
  function _validateAndUpdateDataFeedsValues(bytes32[] memory dataFeedIdsArray, uint256[] memory values) internal virtual;

  /**
   * @dev This function reverts if not enough time passed since the latest update
   */
  function _assertMinIntervalBetweenUpdatesPassed() private view {
    uint256 currentBlockTimestamp = getBlockTimestamp();
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

  /**
   * @notice Returns minimal required interval (usually in seconds) between subsequent updates
   * @dev You can override this function to change the required interval between udpates.
   * Please do not set it to 0, as it may open many attack vectors
   * @return interval The required interval between updates
   */
  function getMinIntervalBetweenUpdates() public view virtual returns (uint256) {
    return MIN_INTERVAL_BETWEEN_UPDATES;
  }

  /**
   * @notice Reverts if the proposed timestamp of data packages it too old or too new
   * comparing to the block.timestamp. It also ensures that the proposed timestamp is newer
   * Then the one from the previous update
   * @param dataPackagesTimestamp The proposed timestamp (usually in milliseconds)
   */
  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp) public view {
    _preventUpdateWithOlderDataPackages(dataPackagesTimestamp);
    validateDataPackagesTimestampOnce(dataPackagesTimestamp);
  }


  /**
   * @notice Reverts if the proposed timestamp of data packages it too old or too new
   * comparing to the current block timestamp
   * @param dataPackagesTimestamp The proposed timestamp (usually in milliseconds)
   */
  function validateDataPackagesTimestampOnce(uint256 dataPackagesTimestamp) public view virtual {
    uint256 receivedTimestampSeconds = dataPackagesTimestamp / 1000;

    (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) = getAllowedTimestampDiffsInSeconds();

    uint256 blockTimestamp = getBlockTimestamp();

    if (blockTimestamp < receivedTimestampSeconds) {
      if ((receivedTimestampSeconds - blockTimestamp) > maxDataAheadSeconds) {
        revert RedstoneDefaultsLib.TimestampFromTooLongFuture(receivedTimestampSeconds, blockTimestamp);
      }
    } else if ((blockTimestamp - receivedTimestampSeconds) > maxDataDelaySeconds) {
      revert RedstoneDefaultsLib.TimestampIsTooOld(receivedTimestampSeconds, blockTimestamp);
    }
  }

  /**
   * @dev This function can be overriden, e.g. to use block.number instead of block.timestamp
   * It can be useful in some L2 chains, as sometimes their different blocks can have the same timestamp
   * @return timestamp Timestamp or Block number or any other number that can identify time in the context
   * of the given blockchain
   */
  function getBlockTimestamp() public view virtual returns (uint256) {
    return block.timestamp;
  }

  /**
   * @dev Helpful function for getting values for timestamp validation
   * @return  maxDataAheadSeconds Max allowed number of seconds ahead of block.timrstamp
   * @return  maxDataDelaySeconds Max allowed number of seconds for data delay
   */
  function getAllowedTimestampDiffsInSeconds() public view virtual returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_SECONDS;
    maxDataDelaySeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_DELAY_SECONDS;
  }

  /**
   * @dev Reverts if proposed data packages are not newer than the ones used previously
   * @param dataPackagesTimestamp Timestamp od the data packages (usually in milliseconds)
   */
  function _preventUpdateWithOlderDataPackages(uint256 dataPackagesTimestamp) internal view {
    uint256 dataTimestampFromLatestUpdate = getDataTimestampFromLatestUpdate();

    if (dataPackagesTimestamp <= dataTimestampFromLatestUpdate) {
      revert DataTimestampShouldBeNewerThanBefore(
        dataPackagesTimestamp,
        dataTimestampFromLatestUpdate
      );
    }
  }

  /**
   * @notice Returns data timestamp from the latest update
   * @dev It's virtual, because its implementation can sometimes be different
   * (e.g. SinglePriceFeedAdapterWithClearing)
   * @return lastDataTimestamp Timestamp of the latest reported data packages
   */
  function getDataTimestampFromLatestUpdate() public view virtual returns (uint256 lastDataTimestamp) {
    (lastDataTimestamp, ) = getTimestampsFromLatestUpdate();
  }

  /**
   * @notice Returns block timestamp of the latest successful update
   * @return blockTimestamp The block timestamp of the latest successful update
   */
  function getBlockTimestampFromLatestUpdate() public view returns (uint256 blockTimestamp) {
    (, blockTimestamp) = getTimestampsFromLatestUpdate();
  }

  /**
   * @dev Returns 2 timestamps packed into a single uint256 number
   * @return packedTimestamps a single uin256 number with 2 timestamps
   */
  function getPackedTimestampsFromLatestUpdate() public view returns (uint256 packedTimestamps) {
    assembly {
      packedTimestamps := sload(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION)
    }
  }

  /**
   * @notice Returns timestamps of the latest successful update
   * @return dataTimestamp timestamp (usually in milliseconds) from the signed data packages
   * @return blockTimestamp timestamp of the block when the update has happened
   */
  function getTimestampsFromLatestUpdate() public view virtual returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    return _unpackTimestamps(getPackedTimestampsFromLatestUpdate());
  }


  /**
   * @dev A helpful function to unpack 2 timestamps from one uin256 number
   * @param packedTimestamps a single uin256 number
   * @return dataTimestamp fetched from left 128 bits
   * @return blockTimestamp fetched from right 128 bits
   */
  function _unpackTimestamps(uint256 packedTimestamps) internal pure returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    dataTimestamp = uint128(packedTimestamps >> 128); // left 128 bits
    blockTimestamp = uint128(packedTimestamps); // right 128 bits
  }


  /**
   * @dev Logic of saving timestamps of the current update
   * By default, it stores packed timestamps in one storage slot (32 bytes)
   * to minimise gas costs
   * But it can be overriden (e.g. in SinglePriceFeedAdapter)
   * @param   dataPackagesTimestamp  .
   */
  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) internal virtual {
    uint256 blockTimestamp = getBlockTimestamp();

    if (blockTimestamp > MAX_NUMBER_FOR_128_BITS) {
      revert BlockTimestampIsTooBig(blockTimestamp);
    }

    if (dataPackagesTimestamp > MAX_NUMBER_FOR_128_BITS) {
      revert DataTimestampIsTooBig(dataPackagesTimestamp);
    }

    assembly {
      let timestamps := or(shl(BITS_COUNT_IN_16_BYTES, dataPackagesTimestamp), blockTimestamp)
      sstore(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION, timestamps)
    }
  }

  /**
   * @notice Returns the latest properly reported value of the data feed
   * @param dataFeedId The identifier of the requested data feed
   * @return value The latest value of the given data feed
   */
  function getValueForDataFeed(bytes32 dataFeedId) public view returns (uint256) {
    getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported

    // "unsafe" here means "without validation"
    uint256 valueForDataFeed = getValueForDataFeedUnsafe(dataFeedId);

    validateDataFeedValueOnRead(dataFeedId, valueForDataFeed);
    return valueForDataFeed;
  }

  /**
   * @notice Returns the latest properly reported values for several data feeds
   * @param dataFeedIds The array of identifiers for the requested feeds
   * @return values Values of the requested data feeds in the corresponding order
   */
  function getValuesForDataFeeds(bytes32[] memory dataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory values = getValuesForDataFeedsUnsafe(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length;) {
      bytes32 dataFeedId = dataFeedIds[i];
      getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported
      validateDataFeedValueOnRead(dataFeedId, values[i]);
      unchecked { i++; } // reduces gas costs
    }
    return values;
  }



  /**
   * @dev Reverts if proposed value for the proposed data feed id is invalid
   * Is called on every NOT *unsafe method which reads dataFeed
   * By default, it just checks if the value is not equal to 0, but it can be extended
   * @param dataFeedId The data feed identifier
   * @param valueForDataFeed Proposed value for the data feed
   */
  function validateDataFeedValueOnRead(bytes32 dataFeedId, uint256 valueForDataFeed) public view virtual {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }

  /**
   * @dev Reverts if proposed value for the proposed data feed id is invalid
   * Is called on every NOT *unsafe method which writes dataFeed
   * By default, it does nothing
   * @param dataFeedId The data feed identifier
   * @param valueForDataFeed Proposed value for the data feed
   */
  function validateDataFeedValueOnWrite(bytes32 dataFeedId, uint256 valueForDataFeed) public view virtual {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }

  /**
   * @dev [HIGH RISK] Returns the latest value for a given data feed without validation
   * Important! Using this function instead of `getValueForDataFeed` may cause
   * significant risk for your smart contracts
   * @param dataFeedId The data feed identifier
   * @return dataFeedValue Unvalidated value of the latest successful update
   */
  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view virtual returns (uint256);

  /**
   * @notice [HIGH RISK] Returns the latest properly reported values for several data feeds without validation
   * Important! Using this function instead of `getValuesForDataFeeds` may cause
   * significant risk for your smart contracts
   * @param requestedDataFeedIds The array of identifiers for the requested feeds
   * @return values Unvalidated values of the requested data feeds in the corresponding order
   */
  function getValuesForDataFeedsUnsafe(bytes32[] memory requestedDataFeedIds) public view virtual returns (uint256[] memory values) {
    values = new uint256[](requestedDataFeedIds.length);
    for (uint256 i = 0; i < requestedDataFeedIds.length;) {
      values[i] = getValueForDataFeedUnsafe(requestedDataFeedIds[i]);
      unchecked { i++; } // reduces gas costs
    }
    return values;
  }
}
