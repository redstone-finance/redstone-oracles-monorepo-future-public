// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SinglePriceFeedAdapter} from "./SinglePriceFeedAdapter.sol";

/**
 * @title [HIGH RISK] Price feed adapter for one specific data feed without
 * rounds support, with storage clearing feature
 * @author The Redstone Oracles team
 * @dev This contract has a significant security risk, as it allows to
 * update oracle data with older timestamps then the previous one. It can
 * open many opportunities for attackers to manipulate the values and use it
 * for arbitrage. Use it only if you know what you are doing very well
 */
abstract contract SinglePriceFeedAdapterWithClearing is SinglePriceFeedAdapter {

  bytes32 internal constant TEMP_DATA_TIMESTAMP_STORAGE_LOCATION = 0x9ba2e81f7980c774323961547312ae2319fc1970bb8ec60c86c869e9a1c1c0d2; // keccak256("RedStone.tempDataTimestampStorageLocation");
  uint256 internal constant MAX_VALUE_WITH_26_BYTES = 0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffff;
  uint256 internal constant BIT_MASK_TO_CLEAR_LAST_26_BYTES = 0xffffffffffff0000000000000000000000000000000000000000000000000000;

  function validateDataFeedValueOnWrite(bytes32 dataFeedId, uint256 valueForDataFeed) public view virtual override {
    super.validateDataFeedValueOnWrite(dataFeedId, valueForDataFeed);
    if (valueForDataFeed > MAX_VALUE_WITH_26_BYTES) {
      revert DataFeedValueTooBig(valueForDataFeed);
    }
  }

  function getValueForDataFeedUnsafe(bytes32) public view override virtual returns (uint256 dataFeedValue) {
    uint208 dataFeedValueCompressed;
    assembly {
      dataFeedValueCompressed := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
    }
    return uint256(dataFeedValueCompressed);
  }

  function getTimestampsFromLatestUpdate() public view override virtual returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    uint256 latestUpdateDetails;
    assembly {
      latestUpdateDetails := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
    }
    blockTimestamp = uint128(latestUpdateDetails >> 208); // first 48 bits
    dataTimestamp = blockTimestamp * 1000; // It's a hack, because we don't store dataTimestamp in storage in this version of adapter
  }

  function getDataTimestampFromLatestUpdate() public view virtual override returns (uint256 lastDataTimestamp) {
    assembly {
      lastDataTimestamp := sload(TEMP_DATA_TIMESTAMP_STORAGE_LOCATION)
    }
  }

  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) virtual internal override {
    validateDataFeedValueOnWrite(dataFeedId, dataFeedValue);
    uint256 blockTimestampCompressedAndShifted = getBlockTimestamp() << 208; // Move value to the first 48 bits
    assembly {
      // Save timestamp and data feed value
      let timestampAndValue := or(blockTimestampCompressedAndShifted, dataFeedValue)
      sstore(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION, timestampAndValue)

      // Clear temp data timestamp, it refunds 19.9k gas
      sstore(TEMP_DATA_TIMESTAMP_STORAGE_LOCATION, 0)
    }
  }

  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp)  virtual internal override {
    assembly {
      sstore(TEMP_DATA_TIMESTAMP_STORAGE_LOCATION, dataPackagesTimestamp)
    }
  }
}
