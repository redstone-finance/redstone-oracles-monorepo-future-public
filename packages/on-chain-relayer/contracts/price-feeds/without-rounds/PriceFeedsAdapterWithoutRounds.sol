// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../PriceFeedsAdapterBase.sol";

abstract contract PriceFeedsAdapterWithoutRounds is PriceFeedsAdapterBase {
  bytes32 constant VALUES_MAPPING_STORAGE_LOCATION = 0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc; // keccak256("RedStone.oracleValuesMapping");

  function _updateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal override {
    validateDataFeedValue(dataFeedId, dataFeedValue);
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId);
    assembly {
      sstore(locationInStorage, dataFeedValue)
    }
  }

  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view override returns (uint256 dataFeedValue) {
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId);
    assembly {
      dataFeedValue := sload(locationInStorage)
    }
  }

  function _getValueLocationInStorage(bytes32 dataFeedId) private pure returns (bytes32) {
    return keccak256(abi.encode(dataFeedId, VALUES_MAPPING_STORAGE_LOCATION));
  }
}
