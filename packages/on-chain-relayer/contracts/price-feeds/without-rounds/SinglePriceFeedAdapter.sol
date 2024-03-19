// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterBase} from "../PriceFeedsAdapterBase.sol";

/**
 * @title Price feed adapter for one specific data feed without rounds support
 * @author The Redstone Oracles team
 * @dev This version works only with a single data feed. It's abstract and
 * the following functions should be implemented in the actual contract
 * before deployment:
 * - getDataFeedId
 * - getUniqueSignersThreshold
 * - getAuthorisedSignerIndex
 * 
 * This contract stores the value along with timestamps in a single storage slot
 * 32 bytes = 6 bytes (Data timestamp ) + 6 bytes (Block timestamp) + 20 bytes (Value)
 */
abstract contract SinglePriceFeedAdapter is PriceFeedsAdapterBase {

  bytes32 internal constant DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION = 0x632f4a585e47073d66129e9ebce395c9b39d8a1fc5b15d4d7df2e462fb1fccfa; // keccak256("RedStone.singlePriceFeedAdapter");
  uint256 internal constant MAX_VALUE_WITH_20_BYTES = 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff;
  uint256 internal constant BIT_MASK_TO_CLEAR_LAST_20_BYTES = 0xffffffffffffffffffffffff0000000000000000000000000000000000000000;
  uint256 internal constant MAX_NUMBER_FOR_48_BITS = 0x0000000000000000000000000000000000000000000000000000ffffffffffff;

  error DataFeedValueTooBig(uint256 valueForDataFeed);

  /**
   * @notice Returns the only data feed identifer supported by the adapter
   * @dev This function should be overriden in the derived contracts,
   * but `getDataFeedIds` and `getDataFeedIndex` should not (and can not)
   * @return dataFeedId The only data feed identifer supported by the adapter
   */
  function getDataFeedId() public view virtual returns (bytes32);

  /**
   * @notice Returns identifiers of all data feeds supported by the Adapter contract
   * In this case - an array with only one element
   * @return dataFeedIds
   */
  function getDataFeedIds() public view virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = getDataFeedId();
  }

  /**
   * @dev Returns 0 if dataFeedId is the one, otherwise reverts
   * @param dataFeedId The identifier of the requested data feed
   */
  function getDataFeedIndex(bytes32 dataFeedId) public virtual view override returns(uint256) {
    if (dataFeedId == getDataFeedId()) {
      return 0;
    } else {
      revert DataFeedIdNotFound(dataFeedId);
    }
  }

  /**
   * @dev Reverts if proposed value for the proposed data feed id is invalid
   * By default, it checks if the value is not equal to 0 and if it fits to 20 bytes
   * Because other 12 bytes are used for storing the packed timestamps
   * @param dataFeedId The data feed identifier
   * @param valueForDataFeed Proposed value for the data feed
   */
  function validateDataFeedValueOnWrite(bytes32 dataFeedId, uint256 valueForDataFeed) public view virtual override {
    super.validateDataFeedValueOnWrite(dataFeedId, valueForDataFeed);
    if (valueForDataFeed > MAX_VALUE_WITH_20_BYTES) {
      revert DataFeedValueTooBig(valueForDataFeed);
    }
  }

  /**
   * @dev [HIGH RISK] Returns the latest value for a given data feed without validation
   * Important! Using this function instead of `getValueForDataFeed` may cause
   * significant risk for your smart contracts
   * @return dataFeedValue Unvalidated value of the latest successful update
   */
  function getValueForDataFeedUnsafe(bytes32) public view virtual override returns (uint256 dataFeedValue) {
    uint160 dataFeedValueCompressed;
    assembly {
      dataFeedValueCompressed := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
    }
    return dataFeedValueCompressed;
  }

  /**
   * @notice Returns timestamps of the latest successful update
   * @dev Timestamps here use only 6 bytes each and are packed together with the value
   * @return dataTimestamp timestamp (usually in milliseconds) from the signed data packages
   * @return blockTimestamp timestamp of the block when the update has happened
   */
  function getTimestampsFromLatestUpdate() public view virtual override returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    uint256 latestUpdateDetails;
    assembly {
      latestUpdateDetails := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
    }
    dataTimestamp = uint128(latestUpdateDetails >> 208); // first 48 bits
    blockTimestamp = uint128((latestUpdateDetails << 48) >> 208); // next 48 bits
  }

  /**
   * @dev Validates and saves the value in the contract storage
   * It uses only 20 right bytes of the corresponding storage slot
   * @param dataFeedId The data feed identifier
   * @param dataFeedValue Proposed value for the data feed
   */
  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal virtual override {
    validateDataFeedValueOnWrite(dataFeedId, dataFeedValue);
    assembly {
      let curValueFromStorage := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
      curValueFromStorage := and(curValueFromStorage, BIT_MASK_TO_CLEAR_LAST_20_BYTES) // clear dataFeedValue bits
      curValueFromStorage := or(curValueFromStorage, dataFeedValue)
      sstore(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION, curValueFromStorage)
    }
  }

  /**
   * @dev Helpful function that packs and saves timestamps in the 12 left bytes of the
   * storage slot reserved for storing details about the latest update
   * @param dataPackagesTimestamp Timestamp from the signed data packages,
   * extracted from the RedStone payload in calldata
   */
  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) internal virtual override {
    uint256 blockTimestamp = getBlockTimestamp();

    if (dataPackagesTimestamp > MAX_NUMBER_FOR_48_BITS) {
      revert DataTimestampIsTooBig(dataPackagesTimestamp);
    }

    if (blockTimestamp > MAX_NUMBER_FOR_48_BITS) {
      revert BlockTimestampIsTooBig(blockTimestamp);
    }

    uint256 timestampsPacked = dataPackagesTimestamp << 208; // 48 first bits for dataPackagesTimestamp
    timestampsPacked |= (blockTimestamp << 160); // 48 next bits for blockTimestamp
    assembly {
      let latestUpdateDetails := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
      latestUpdateDetails := and(latestUpdateDetails, MAX_VALUE_WITH_20_BYTES) // clear timestamp bits
      sstore(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION, or(latestUpdateDetails, timestampsPacked))
    }
  }
}
