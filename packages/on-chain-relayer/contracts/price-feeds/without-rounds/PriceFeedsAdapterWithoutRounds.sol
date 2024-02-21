// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterBase} from "../PriceFeedsAdapterBase.sol";

/**
 * @title Implementation of a price feeds adapter without rounds support
 * @author The Redstone Oracles team
 * @dev This contract is abstract, the following functions should be
 * implemented in the actual contract before deployment:
 * - getDataFeedIds
 * - getUniqueSignersThreshold
 * - getAuthorisedSignerIndex
 * 
 * We also recommend to override `getDataFeedIndex` function with hardcoded
 * values, as it can significantly reduce gas usage
 */
abstract contract PriceFeedsAdapterWithoutRounds is PriceFeedsAdapterBase {
  bytes32 constant VALUES_MAPPING_STORAGE_LOCATION = 0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc; // keccak256("RedStone.oracleValuesMapping");

  /**
   * @dev Helpful virtual function for handling value validation and saving
   * @param dataFeedId The data feed identifier
   * @param dataFeedValue Proposed value for the data feed
   */
  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal override virtual {
    validateDataFeedValueOnWrite(dataFeedId, dataFeedValue);
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId);
    assembly {
      sstore(locationInStorage, dataFeedValue)
    }
  }

  /**
   * @dev [HIGH RISK] Returns the latest value for a given data feed without validation
   * Important! Using this function instead of `getValueForDataFeed` may cause
   * significant risk for your smart contracts
   * @param dataFeedId The data feed identifier
   * @return dataFeedValue Unvalidated value of the latest successful update
   */
  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view  virtual override returns (uint256 dataFeedValue) {
    bytes32 locationInStorage = _getValueLocationInStorage(dataFeedId);
    assembly {
      dataFeedValue := sload(locationInStorage)
    }
  }

  /**
   * @dev Helpful function for getting storage location for the requested data feed
   * @param dataFeedId Requested data feed identifier
   * @return locationInStorage
   */
  function _getValueLocationInStorage(bytes32 dataFeedId) private pure returns (bytes32) {
    return keccak256(abi.encode(dataFeedId, VALUES_MAPPING_STORAGE_LOCATION));
  }
}
