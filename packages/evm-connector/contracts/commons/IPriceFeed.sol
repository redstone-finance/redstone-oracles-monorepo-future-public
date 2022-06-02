// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
 * @title IPriceFeed
 * @dev A minimal interface for contracts providing pricing data
 */
interface IPriceFeed {
  /**
   * @dev return the price of a given asset
   * @param symbol that identifies an asset (it's passed as bytes32 for the gas efficiency)
   **/
  function getPrice(bytes32 symbol) external view returns (uint256);
}
