// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {RedstoneConsumerNumericBase, RedstoneDefaultsLib} from "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import {IMultiFeedAdapter} from "../interfaces/IMultiFeedAdapter.sol";
import {IPriceCalculator} from "../../custom-integrations/layerbank/IPriceCalculator.sol";
import {ILToken} from "../../custom-integrations/layerbank/ILToken.sol";

/**
 * @title MultiFeedAdapterWithoutRounds
 * @author The Redstone Oracles team
 * @dev This abstract contract serves as an adapter for multiple data feeds, facilitating 
 * the updating and retrieval of oracle data values independently.
 *
 * Key details about the contract:
 * - Values for data feeds can be updated using the `updateDataFeedsValuesPartial` function
 * - Unlike the previous version (RedstoneAdapterBase), this adapter allows updating any set of data feeds, 
 *   with each update being made independently.
 * - Updates are highly independent. Each data feed update is attempted separately, ensuring maximum possible
 *   updates without reverting the entire transaction if some of them fail. Both successful value updates and
 *   update skips due to failed validation are represented in corresponding events.
 * - Efficient storage usage: Related timestamps and values are packed into a single 32-byte slot when possible.
 *   If a value exceeds the slot capacity, it is stored in the next slot, with one bool prop (isValueBigger) indicating the storage method used.
 * - All data packages in the Redstone payload must have the same timestamp. Invalid timestamps (too old or too new) will cause transaction reversion.
 * - The contract includes a built-in IPriceCalculator interface used by LayerBank and other projects
 */
abstract contract MultiFeedAdapterWithoutRounds is RedstoneConsumerNumericBase, IMultiFeedAdapter, IPriceCalculator {
  bytes32 internal constant DATA_FEEDS_STORAGE_LOCATION = 0x5e9fb4cb0eb3c2583734d3394f30bb14b241acb9b3a034f7e7ba1a62db4370f1; // keccak256("RedStone.MultiFeedAdapterWithoutRounds.dataFeeds");
  bytes32 internal constant ETH_DATA_FEED_ID = bytes32("ETH");
  uint256 internal constant MAX_DATA_STALENESS = 30 hours;
  uint256 internal constant DEFAULT_DECIMAL_SCALER_LAYERBANK = 1e10;

  error DataTimestampTooLarge(uint256 dataTimestamp);
  error BlockTimestampTooLarge(uint256 blockTimestamp);
  error InvalidLastUpdateDetails(bytes32 dataFeedId, uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue);
  
  event ValueUpdate(uint256 value, bytes32 dataFeedId, uint256 updatedAt);
  event UpdateSkipDueToBlockTimestamp(bytes32 dataFeedId);
  event UpdateSkipDueToDataTimestamp(bytes32 dataFeedId);
  event UpdateSkipDueToInvalidValue(bytes32 dataFeedId);

  // This struct uses exactly one storage slot (32 bytes)
  struct DataFeedDetails {
    uint48 dataTimestamp;
    uint48 blockTimestamp;
    uint152 value;
    bool isValueBigger;
  }

  struct DataFeedDetailsWithOptionalBigValue {
    DataFeedDetails details;
    uint256 biggerValue;
  }

  // This struct is used only for returning values
  struct LastUpdateDetails {
    uint256 dataTimestamp;
    uint256 blockTimestamp;
    uint256 value;
  }

  struct DataFeedsStorage {
    mapping(bytes32 => DataFeedDetailsWithOptionalBigValue) _dataFeeds;
  }

  /// This function allows to update any set of data feeds
  function updateDataFeedsValuesPartial(bytes32[] memory dataFeedsIds) public {
    (uint256[] memory oracleValues, uint256 extractedDataTimestamp) = getOracleNumericValuesAndTimestampFromTxMsg(dataFeedsIds);

    // Revert if data timestamp doesn't fit within the allowed block timestamp window
    validateTimestamp(extractedDataTimestamp);

    // Revert if data or block timestamp do not fit into 48 bits reserved in storage for timestamps
    if (extractedDataTimestamp > type(uint48).max) {
      revert DataTimestampTooLarge(extractedDataTimestamp);
    }
    if (block.timestamp > type(uint48).max) {
      revert BlockTimestampTooLarge(block.timestamp);
    }

    // The logic below can fail only in the case when gas limit reached
    for (uint256 i = 0; i < dataFeedsIds.length;) {
      // Note, each update is independent. It means that we are trying to update everything we can.
      // And skip the rest (emitting corresponding events)
      _tryToUpdateDataFeed(dataFeedsIds[i], oracleValues[i], extractedDataTimestamp);
      unchecked { i++; } // reduces gas costs
    }
  }

  function _tryToUpdateDataFeed(bytes32 dataFeedId, uint256 value, uint256 dataTimestamp) internal virtual {
    (uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue) = getLastUpdateDetailsUnsafe(dataFeedId);

    if (!_validateBlockTimestamp(lastBlockTimestamp)) {
      emit UpdateSkipDueToBlockTimestamp(dataFeedId);
      return;
    }

    if (!_validateDataTimestamp(dataTimestamp, lastDataTimestamp)) {
      emit UpdateSkipDueToDataTimestamp(dataFeedId);
      return;
    }

    if (!_validateValueBeforeSave(dataFeedId, value, lastValue)) {
      emit UpdateSkipDueToInvalidValue(dataFeedId);
      return;
    }

    _saveNewUpdateDetails(dataFeedId, value, dataTimestamp);
    _emitEventAfterValueUpdate(dataFeedId, value);
  }

  function _saveNewUpdateDetails(bytes32 dataFeedId, uint256 newValue, uint256 dataTimestamp) internal {
    DataFeedDetailsWithOptionalBigValue storage dataFeed = _getDataFeedsStorage()._dataFeeds[dataFeedId];

    bool isValueBigger = newValue > type(uint152).max;

    // We can safely cast timestamps here, because we checked timestamp values in the `updateDataFeedsValuesPartial` function
    dataFeed.details = DataFeedDetails({
      dataTimestamp: uint48(dataTimestamp),
      blockTimestamp: uint48(block.timestamp),
      value: uint152(newValue), // we can store anything here is isValueBigger == true, but it's slightly cheaper to always store the same value
      isValueBigger: isValueBigger
    });

    if (isValueBigger) {
      dataFeed.biggerValue = newValue;
    }
  }

  function getLastUpdateDetails(bytes32 dataFeedId) public view virtual returns (uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue) {
    (lastDataTimestamp, lastBlockTimestamp, lastValue) = getLastUpdateDetailsUnsafe(dataFeedId);
    if (!_validateLastUpdateDetailsOnRead(dataFeedId, lastDataTimestamp, lastBlockTimestamp, lastValue)) {
      revert InvalidLastUpdateDetails(dataFeedId, lastDataTimestamp, lastBlockTimestamp, lastValue);
    }
  }

  function getLastUpdateDetailsUnsafe(bytes32 dataFeedId) public view virtual returns (uint256 lastDataTimestamp, uint256 lastBlockTimestamp, uint256 lastValue) {
    DataFeedDetailsWithOptionalBigValue storage dataFeed = _getDataFeedsStorage()._dataFeeds[dataFeedId];

    lastDataTimestamp = dataFeed.details.dataTimestamp;
    lastBlockTimestamp = dataFeed.details.blockTimestamp;

    if (dataFeed.details.isValueBigger) {
      lastValue = dataFeed.biggerValue;
    } else {
      lastValue = dataFeed.details.value;
    }
  }

  function _getDataFeedsStorage() private pure returns (DataFeedsStorage storage $) {
    assembly {
      $.slot := DATA_FEEDS_STORAGE_LOCATION
    }
  }

  /// This function can be used to implement time-based whitelisting (e.g. whitelisting for only X seconds after the latest update)
  /// Important! This function should not revert, it should only return bool result of the validation
  function _validateBlockTimestamp(uint256 lastBlockTimestamp) internal view virtual returns (bool) {
    // In the default implementation we just check if the block number is higher
    // To ensure max 1 update for a given data feed in a block
    return block.timestamp > lastBlockTimestamp;
  }

  /// Important! This function should not revert, it should only return bool result of the validation
  function _validateDataTimestamp(uint256 proposedDataTimestamp, uint256 lastDataTimestamp) internal view virtual returns (bool) {
    return proposedDataTimestamp > lastDataTimestamp;
  }

  /// Important! This function should not revert, it should only return bool result of the validation
  /// It can be overriden to handle more specific logic in future
  function _validateValueBeforeSave(bytes32 /* dataFeedId */, uint256 proposedValue, uint256 /* lastValue */) internal view virtual returns (bool) {
    return proposedValue > 0;
  }

  /// This function can be overriden (e.g. value validation and staleness check)
  /// We've added dataFeedId for being able to implement custom validation per feed
  function _validateLastUpdateDetailsOnRead(bytes32 /* dataFeedId */, uint256 /* lastDataTimestamp */, uint256 lastBlockTimestamp, uint256 lastValue) internal view virtual returns (bool) {
    return lastValue > 0 && lastBlockTimestamp + MAX_DATA_STALENESS > block.timestamp;
  }

  /// Important! This function should not revert, it should only emit an event
  /// It is a separate function, so that we can specify custom events for specific data feeds
  function _emitEventAfterValueUpdate(bytes32 dataFeedId, uint256 newValue) internal virtual {
    emit ValueUpdate(newValue, dataFeedId, block.timestamp);
  }


  ////////////////////////////////////////////////////
  /////////// Functions for relayers below ///////////
  ////////////////////////////////////////////////////

  function getLastUpdateDetailsUnsafeForMany(bytes32[] memory dataFeedIds) external view returns (LastUpdateDetails[] memory detailsForFeeds) {
    detailsForFeeds = new LastUpdateDetails[](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length;) {
      (detailsForFeeds[i].dataTimestamp, detailsForFeeds[i].blockTimestamp, detailsForFeeds[i].value) = getLastUpdateDetailsUnsafe(dataFeedIds[i]);
      unchecked { i++; } // reduces gas costs
    }
  }

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) external view returns (uint256[] memory values) {
    values = new uint256[](requestedDataFeedIds.length);
    for (uint256 i = 0; i < requestedDataFeedIds.length;) {
      values[i] = getValueForDataFeed(requestedDataFeedIds[i]);
      unchecked { i++; } // reduces gas costs
    }
  }

  function getValueForDataFeed(bytes32 dataFeedId) public view virtual returns (uint256 dataFeedValue) {
    (,, dataFeedValue) = getLastUpdateDetails(dataFeedId);
  }

  function getDataTimestampFromLatestUpdate(bytes32 dataFeedId) external view virtual returns (uint256 lastDataTimestamp) {
    (lastDataTimestamp, ,) = getLastUpdateDetails(dataFeedId);
  }

  function getBlockTimestampFromLatestUpdate(bytes32 dataFeedId) external view virtual returns (uint256 blockTimestamp) {
    (, blockTimestamp, ) = getLastUpdateDetails(dataFeedId);
  }

  ///////////////////////////////////////////////////////
  //////////// LayerBank interface functions ////////////
  ///////////////////////////////////////////////////////

  /// We can connect manager contract here or implement it directly here
  /// By default, users will be able to use data feed identifiers (casted to addresses) in layerbank functions
  function getDataFeedIdForAsset(address asset) public view virtual returns(bytes32) {
    return bytes32(uint256(uint160(asset)));
  }

  function convertDecimals(bytes32 /* dataFeedId */, uint256 valueFromRedstonePayload) public view virtual returns (uint256) {
    return valueFromRedstonePayload * DEFAULT_DECIMAL_SCALER_LAYERBANK;
  }

  function getUnderlyingAsset(address gToken) public view virtual returns(address) {
    return ILToken(gToken).underlying();
  }

  function priceOf(address asset) public view virtual returns (uint256) {
    bytes32 dataFeedId = getDataFeedIdForAsset(asset);
    uint256 latestValue = getValueForDataFeed(dataFeedId);
    return convertDecimals(dataFeedId, latestValue);
  }

  function priceOfETH() public view virtual returns (uint256) {
    return convertDecimals(ETH_DATA_FEED_ID, getValueForDataFeed(ETH_DATA_FEED_ID));
  }

  function pricesOf(
    address[] memory assets
  ) external view returns (uint256[] memory values) {
    values = new uint256[](assets.length);
    for (uint256 i = 0; i < assets.length;) {
      values[i] = priceOf(assets[i]);
      unchecked { i++; } // reduces gas costs
    }
  }

  function getUnderlyingPrice(address gToken) public view returns (uint256) {
    return priceOf(getUnderlyingAsset(gToken));
  }

  function getUnderlyingPrices(
    address[] memory gTokens
  ) public view returns (uint256[] memory values) {
    values = new uint256[](gTokens.length);
    for (uint256 i = 0; i < gTokens.length;) {
      values[i] = getUnderlyingPrice(gTokens[i]);
      unchecked { i++; } // reduces gas costs
    }
  }
}
