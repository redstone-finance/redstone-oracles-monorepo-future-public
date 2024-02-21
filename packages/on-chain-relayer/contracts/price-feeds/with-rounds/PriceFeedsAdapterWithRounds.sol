// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterBase} from "../PriceFeedsAdapterBase.sol";

/**
 * @title Price feeds adapter contract with rounds support
 * @author The Redstone Oracles team
 * @dev This contract is abstract. The actual contract instance
 * must implement the following functions:
 * - getDataFeedIds
 * - getUniqueSignersThreshold
 * - getAuthorisedSignerIndex
 *
 * We also recommend to override `getDataFeedIndex` function with hardcoded
 * values, as it can significantly reduce gas usage
 */
abstract contract PriceFeedsAdapterWithRounds is PriceFeedsAdapterBase {
  bytes32 constant VALUES_MAPPING_STORAGE_LOCATION = 0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc; // keccak256("RedStone.oracleValuesMapping");
  bytes32 constant ROUND_TIMESTAMPS_MAPPING_STORAGE_LOCATION = 0x207e00944d909d1224f0c253d58489121d736649f8393199f55eecf4f0cf3eb0; // keccak256("RedStone.roundTimestampMapping");
  bytes32 constant LATEST_ROUND_ID_STORAGE_LOCATION = 0xc68d7f1ee07d8668991a8951e720010c9d44c2f11c06b5cac61fbc4083263938; // keccak256("RedStone.latestRoundId");

  error RoundNotFound(uint256 roundId);

  /**
   * @dev Saved new round data to the storage
   * @param dataFeedIdsArray Array of all data feeds identifiers
   * @param values The reported values that are validated and reported
   */
  function _validateAndUpdateDataFeedsValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual override {
    _incrementLatestRoundId();
    _updatePackedTimestampsForLatestRound();

    for (uint256 i = 0; i < dataFeedIdsArray.length;) {
      _validateAndUpdateDataFeedValue(dataFeedIdsArray[i], values[i]);
      unchecked { i++; } // reduces gas costs
    }
  }

  /**
   * @dev Helpful virtual function for handling value validation and updating
   * @param dataFeedId The data feed identifier
   * @param dataFeedValue Proposed value for the data feed
   */
  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal virtual override {
    validateDataFeedValueOnWrite(dataFeedId, dataFeedValue);
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId, getLatestRoundId());
    assembly {
      sstore(locationInStorage, dataFeedValue)
    }
  }

  /**
   * @dev [HIGH RISK] Returns the value for a given data feed from the latest round
   * without validation. Important! Using this function instead of `getValueForDataFeed`
   * may cause significant risk for your smart contracts
   * @param dataFeedId The data feed identifier
   * @return dataFeedValue Unvalidated value of the latest successful update
   */
  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view override returns (uint256 dataFeedValue) {
    return getValueForDataFeedAndRound(dataFeedId, getLatestRoundId());
  }

  /**
   * @dev [HIGH RISK] Returns value for the requested data feed from the given round
   * without validation.
   * @param dataFeedId The data feed identifier
   * @param roundId The number of the requested round
   * @return dataFeedValue value for the requested data feed from the given round
   */
  function getValueForDataFeedAndRound(bytes32 dataFeedId, uint256 roundId) public view returns (uint256 dataFeedValue) {
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId, roundId);
    assembly {
      dataFeedValue := sload(locationInStorage)
    }
  }


  /**
   * @notice Returns data from the latest successful round
   * @return latestRoundId
   * @return latestRoundDataTimestamp
   * @return latestRoundBlockTimestamp
   */
  function getLatestRoundParams() public view returns ( uint256 latestRoundId, uint128 latestRoundDataTimestamp, uint128 latestRoundBlockTimestamp) {
    latestRoundId = getLatestRoundId();
    uint256 packedRoundTimestamps = getPackedTimestampsForRound(latestRoundId);
    (latestRoundDataTimestamp, latestRoundBlockTimestamp) = _unpackTimestamps(
      packedRoundTimestamps
    );
  }


  /**
   * @notice Returns details for the given round and data feed
   * @param dataFeedId Requested data feed
   * @param roundId Requested round identifier
   * @return dataFeedValue
   * @return roundDataTimestamp
   * @return roundBlockTimestamp
   */
  function getRoundDataFromAdapter(bytes32 dataFeedId, uint256 roundId) public view returns (uint256 dataFeedValue, uint128 roundDataTimestamp, uint128 roundBlockTimestamp) {
    if (roundId > getLatestRoundId() || roundId == 0) {
      revert RoundNotFound(roundId);
    }

    dataFeedValue = getValueForDataFeedAndRound(dataFeedId, roundId);
    validateDataFeedValueOnRead(dataFeedId, dataFeedValue);
    uint256 packedRoundTimestamps = getPackedTimestampsForRound(roundId);
    (roundDataTimestamp, roundBlockTimestamp) = _unpackTimestamps(packedRoundTimestamps);
  }


  /**
   * @dev Helpful function for getting storage location for requested value
   * @param dataFeedId Requested data feed identifier
   * @param roundId Requested round number
   * @return locationInStorage
   */
  function _getValueLocationInStorage(bytes32 dataFeedId, uint256 roundId) private pure returns (bytes32) {
    return keccak256(abi.encode(dataFeedId, roundId, VALUES_MAPPING_STORAGE_LOCATION));
  }


  /**
   * @dev Helpful function for getting storage location for round timestamps
   * @param roundId Requested round number
   * @return locationInStorage
   */
  function _getRoundTimestampsLocationInStorage(uint256 roundId) private pure returns (bytes32) {
    return keccak256(abi.encode(roundId, ROUND_TIMESTAMPS_MAPPING_STORAGE_LOCATION));
  }


  /**
   * @notice Returns latest successful round number
   * @return latestRoundId
   */
  function getLatestRoundId() public view returns (uint256 latestRoundId) {
    assembly {
      latestRoundId := sload(LATEST_ROUND_ID_STORAGE_LOCATION)
    }
  }

  /**
   * @dev Helpful function for incrementing the latest round number by 1 in
   * the contract storage
   */
  function _incrementLatestRoundId() private {
    uint256 latestRoundId = getLatestRoundId();
    assembly {
      sstore(LATEST_ROUND_ID_STORAGE_LOCATION, add(latestRoundId, 1))
    }
  }

  /**
   * @notice Returns timestamps related to the given round packed into one number
   * @param roundId Requested round number
   * @return roundTimestamps
   */
  function getPackedTimestampsForRound(uint256 roundId) public view returns (uint256 roundTimestamps) {
    bytes32 locationInStorage = _getRoundTimestampsLocationInStorage(roundId);
    assembly {
      roundTimestamps := sload(locationInStorage)
    }
  }


  /**
   * @dev Saves packed timestamps (data and block.timestamp) in the contract storage
   */
  function _updatePackedTimestampsForLatestRound() private {
    uint256 packedTimestamps = getPackedTimestampsFromLatestUpdate();
    uint256 latestRoundId = getLatestRoundId();
    bytes32 locationInStorage = _getRoundTimestampsLocationInStorage(latestRoundId);
    assembly {
      sstore(locationInStorage, packedTimestamps)
    }
  }
}
