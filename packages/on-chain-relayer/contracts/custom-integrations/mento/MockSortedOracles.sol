// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.14;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ISortedOracles} from "./ISortedOracles.sol";
import {AddressSortedLinkedListWithMedian} from "./linkedlists/AddressSortedLinkedListWithMedian.sol";
import {SortedLinkedListWithMedian} from "./linkedlists/SortedLinkedListWithMedian.sol";

/**
 * @title Simplified mock version of the SortedOracles contract
 * @author The Mento team (the code modified by the RedStone team)
 * @dev It is used for testing the Mento adapter contract
 */
contract MockSortedOracles is ISortedOracles {
  using SafeMath for uint256;
  using AddressSortedLinkedListWithMedian for SortedLinkedListWithMedian.List;

  uint256 private constant FIXED1_UINT = 1e24;

  uint256 public reportExpirySeconds;

  // Maps a rateFeedID to a sorted list of report values.
  mapping(address => SortedLinkedListWithMedian.List) private rates;
  // Maps a rateFeedID to a sorted list of report timestamps.
  mapping(address => SortedLinkedListWithMedian.List) private timestamps;

  /**
   * @notice Removes a report that is expired.
   * @param token The rateFeedId of the report to be removed.
   * @param n The number of expired reports to remove, at most (deterministic upper gas bound).
   */
  function removeExpiredReports(address token, uint256 n) external {
    require(
      token != address(0) && n < timestamps[token].getNumElements(),
      "token addr null or trying to remove too many reports"
    );
    for (uint256 i = 0; i < n; i = i.add(1)) {
      (bool isExpired, address oldestAddress) = isOldestReportExpired(token);
      if (isExpired) {
        removeReport(token, oldestAddress);
      } else {
        break;
      }
    }
  }

  /**
   * @notice Check if last report is expired.
   * @param token The rateFeedId of the reports to be checked.
   * @return bool A bool indicating if the last report is expired.
   * @return address Oracle address of the last report.
   */
  function isOldestReportExpired(address token) public view returns (bool, address) {
    // solhint-disable-next-line reason-string
    require(token != address(0));
    address oldest = timestamps[token].getTail();
    uint256 timestamp = timestamps[token].getValue(oldest);
    // solhint-disable-next-line not-rely-on-time
    if (block.timestamp.sub(timestamp) >= getTokenReportExpirySeconds(token)) {
      return (true, oldest);
    }
    return (false, oldest);
  }

  /**
   * @notice Updates an oracle value and the median.
   * @param token The rateFeedId for the rate that is being reported.
   * @param value The number of stable asset that equate to one unit of collateral asset, for the
   *              specified rateFeedId, expressed as a fixidity value.
   * @param lesserKey The element which should be just left of the new oracle value.
   * @param greaterKey The element which should be just right of the new oracle value.
   * @dev Note that only one of `lesserKey` or `greaterKey` needs to be correct to reduce friction.
   */
  function report(address token, uint256 value, address lesserKey, address greaterKey) external {
    // uint256 originalMedian = rates[token].getMedianValue();
    if (rates[token].contains(msg.sender)) {
      rates[token].update(msg.sender, value, lesserKey, greaterKey);

      // Rather than update the timestamp, we remove it and re-add it at the
      // head of the list later. The reason for this is that we need to handle
      // a few different cases:
      //   1. This oracle is the only one to report so far. lesserKey = address(0)
      //   2. Other oracles have reported since this one's last report. lesserKey = getHead()
      //   3. Other oracles have reported, but the most recent is this one.
      //      lesserKey = key immediately after getHead()
      //
      // However, if we just remove this timestamp, timestamps[token].getHead()
      // does the right thing in all cases.
      timestamps[token].remove(msg.sender);
    } else {
      rates[token].insert(msg.sender, value, lesserKey, greaterKey);
    }
    timestamps[token].insert(
      msg.sender,
      // solhint-disable-next-line not-rely-on-time
      block.timestamp,
      timestamps[token].getHead(),
      address(0)
    );
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param token The rateFeedId for which the collateral asset exchange rate is being reported.
   * @return keys Keys of nn unpacked list of elements from largest to smallest.
   * @return values Values of an unpacked list of elements from largest to smallest.
   * @return relations Relations of an unpacked list of elements from largest to smallest.
   */
  function getRates(
    address token
  )
    external
    view
    returns (
      address[] memory,
      uint256[] memory,
      SortedLinkedListWithMedian.MedianRelation[] memory
    )
  {
    return rates[token].getElements();
  }

  /**
   * @notice Returns the number of rates that are currently stored for a specifed rateFeedId.
   * @param token The rateFeedId for which to retrieve the number of rates.
   * @return uint256 The number of reported oracle rates stored for the given rateFeedId.
   */
  function numRates(address token) public view returns (uint256) {
    return rates[token].getNumElements();
  }

  /**
   * @notice Returns the median of the currently stored rates for a specified rateFeedId.
   * @param token The rateFeedId of the rates for which the median value is being retrieved.
   * @return uint256 The median exchange rate for rateFeedId.
   * @return fixidity
   */
  function medianRate(address token) external view returns (uint256, uint256) {
    return (rates[token].getMedianValue(), numRates(token) == 0 ? 0 : FIXED1_UINT);
  }

  /**
   * @notice Returns the number of timestamps.
   * @param token The rateFeedId for which the collateral asset exchange rate is being reported.
   * @return uint256 The number of oracle report timestamps for the specified rateFeedId.
   */
  function numTimestamps(address token) public view returns (uint256) {
    return timestamps[token].getNumElements();
  }

  /**
   * @notice Checks if a report exists for a specified rateFeedId from a given oracle.
   * @param token The rateFeedId to be checked.
   * @param oracle The oracle whose report should be checked.
   * @return bool True if a report exists, false otherwise.
   */
  function reportExists(address token, address oracle) internal view returns (bool) {
    return rates[token].contains(oracle) && timestamps[token].contains(oracle);
  }

  function getTokenReportExpirySeconds(address token) public view returns (uint256) {
    token;
    return reportExpirySeconds;
  }

  /**
   * @notice Removes an oracle value and updates the median.
   * @param token The rateFeedId for which the collateral asset exchange rate is being reported.
   * @param oracle The oracle whose value should be removed.
   * @dev This can be used to delete elements for oracles that have been removed.
   * However, a > 1 elements reports list should always be maintained
   */
  function removeReport(address token, address oracle) private {
    if (numTimestamps(token) == 1 && reportExists(token, oracle)) return;
    rates[token].remove(oracle);
    timestamps[token].remove(oracle);
  }
}
