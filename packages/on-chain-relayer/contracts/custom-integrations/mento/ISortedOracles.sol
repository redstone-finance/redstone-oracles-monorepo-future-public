// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.14;

import {SortedLinkedListWithMedian} from "./linkedlists/SortedLinkedListWithMedian.sol";

/**
 * @title Simplified interface of the SortedOracles contract
 * @author The Mento team (modified by the Redstone team)
 * @dev Some functions were removed to simplify implementation
 * of the mock SortedOracles contract. Interfaces of the functions
 * below are identical with the original ISortedOracles interface
 */
interface ISortedOracles {
  function report(address, uint256, address, address) external;

  function removeExpiredReports(address, uint256) external;

  function getRates(
    address
  )
    external
    view
    returns (
      address[] memory,
      uint256[] memory,
      SortedLinkedListWithMedian.MedianRelation[] memory
    );

  function numTimestamps(address) external view returns (uint256);

  function medianRate(address) external view returns (uint256, uint256);
}
