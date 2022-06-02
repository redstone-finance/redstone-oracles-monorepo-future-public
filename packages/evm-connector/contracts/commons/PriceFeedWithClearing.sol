// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "./PriceVerifier.sol";
import "./PriceFeed.sol";

/**
 * @title PriceFeedWithClearing
 * @dev An extension to the PriceFeed contract that allows erasing data after usage
 * This may help to reduce the gas costs in some scenarios
 */
contract PriceFeedWithClearing is PriceFeed {
  // A user that sets the prices in the context of the current transaction
  address internal currentSetter;

  /**
   * @dev clear the prices to receive a gas refund
   * @param priceData, a set of prices that need to be erased
   **/
  function clearPrices(PriceData calldata priceData) external {
    require(
      currentSetter == msg.sender,
      "The prices could be cleared only by the address which set them"
    );
    for (uint256 i = 0; i < priceData.symbols.length; i++) {
      delete prices[priceData.symbols[i]];
    }

    currentSetter = address(0);
  }

  /**
   * @dev set the prices and records the account which provided data
   * This mechanism is used to ensure that only the setter of original data is able to erase information
   * @param priceData, a set of prices that are put in the storage
   **/
  function _setPrices(PriceData calldata priceData) internal override {
    require(
      currentSetter == address(0),
      "The prices could be set only once in the transaction"
    );

    super._setPrices(priceData);

    currentSetter = msg.sender;
  }
}
