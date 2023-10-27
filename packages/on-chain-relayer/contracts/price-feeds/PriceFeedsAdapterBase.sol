// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {RedstoneAdapterBase} from "../core/RedstoneAdapterBase.sol";

/**
 * @title Common logic of the price feeds adapter contracts
 * @author The Redstone Oracles team
 */
abstract contract PriceFeedsAdapterBase is RedstoneAdapterBase, Initializable {

  /**
   * @dev Helpful function for upgradable contracts
   */
  function initialize() public virtual initializer {
    // We don't have storage variables, but we keep this function
    // Because it is used for contract setup in upgradable contracts
  }

  /**
   * @dev This function is virtual and may contain additional logic in the derived contract
   * E.g. it can check if the updating conditions are met (e.g. if at least one
   * value is deviated enough)
   * @param dataFeedIdsArray Array of all data feeds identifiers
   * @param values The reported values that are validated and reported
   */
  function _validateAndUpdateDataFeedsValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual override {
    for (uint256 i = 0; i < dataFeedIdsArray.length;) {
      _validateAndUpdateDataFeedValue(dataFeedIdsArray[i], values[i]);
      unchecked { i++; } // reduces gas costs
    }
  }

  /**
   * @dev Helpful virtual function for handling value validation and saving in derived
   * Price Feed Adapters contracts 
   * @param dataFeedId The data feed identifier
   * @param dataFeedValue Proposed value for the data feed
   */
  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal virtual;
}
