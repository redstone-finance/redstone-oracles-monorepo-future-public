// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../commons/IPriceFeed.sol";

/**
 * @title MockStatePriceProvider
 * @dev It simulates an external contract that provides price information taken from storage.
 * It is a minimal version of other oracle referential data contracts
 * like AggregatorInterface from Chainlink or IStdReference from Band
 * and provides a lower bound for gas cost benchmarks.
 */
contract MockStatePriceProvider is IPriceFeed {
  uint256 price = 777;

  /**
   * @dev gets mocked price
   * @param symbol of the price - kept for interface compatibility
   **/
  function getPrice(bytes32 symbol) public view override returns (uint256) {
    symbol; // It's added to avoid warnings about an unused function argument
    return price;
  }

  /**
   * @dev sets new price allowing to update the mocked value
   * @param _price value of a new price
   **/
  function setPrice(uint256 _price) external {
    price = _price;
  }
}
