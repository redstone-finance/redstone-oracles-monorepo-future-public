// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "./ISortedOracles.sol";
import "./MentoDataFeedsManager.sol";
import "../../core/PermissionlessPriceUpdater.sol";

/**
 * @title Redstone oracles adapter for the Mento SortedOracles contract
 * @author The Redstone Oracles team
 * @dev This contract should be whitelisted as an oracle client in the
 * SortedOracles contract. It allows anyone to push signed oracle data
 * to report them in the Mento SortedOracles contract. It is ownable,
 * the owner can manage delivered data feeds and corresponding token
 * addresses.
 *
 */
contract MentoAdapter is MainDemoConsumerBase, PermissionlessPriceUpdater, MentoDataFeedsManager {
  // RedStone provides values with 8 decimals
  // Mento sorted oracles expect 24 decimals (24 - 8 = 16)
  uint256 private constant PRICE_MULTIPLIER = 1e16;

  ISortedOracles public sortedOracles;

  struct LocationInSortedLinkedList {
    address lesserKey;
    address greaterKey;
  }

  constructor(ISortedOracles sortedOracles_) {
    sortedOracles = sortedOracles_;
  }

  function updateSortedOraclesAddress(ISortedOracles sortedOracles_) external onlyOwner {
    sortedOracles = sortedOracles_;
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateDataPackageTimestampAgainstProposedTimestamp(receivedTimestampMilliseconds);
  }

  /**
   * @notice Helpful function to simplify the mento relayer implementation
   */
  function updatePriceValuesAndCleanOldReports(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) external {
    updatePriceValues(proposedRound, proposedTimestamp, locationsInSortedLinkedLists);
    removeAllExpiredReports();
  }

  /**
   * @notice Used for getting proposed values from RedStone's data packages
   * @param dataFeedIds An array of data feed identifiers
   * @return values The normalized values for corresponding data feeds
   */
  function getNormalizedOracleValuesFromTxCalldata(
    bytes32[] calldata dataFeedIds
  ) external view returns (uint256[] memory) {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < values.length; i++) {
      values[i] = normalizeRedstoneValueForMento(values[i]);
    }
    return values;
  }

  function removeAllExpiredReports() public {
    uint256 tokensLength = getDataFeedsCount();
    for (uint256 tokenIndex = 0; tokenIndex < tokensLength; tokenIndex++) {
      (, address tokenAddress) = getTokenDetailsAtIndex(tokenIndex);
      uint256 curNumberOfReports = sortedOracles.numTimestamps(tokenAddress);
      if (curNumberOfReports > 0) {
        sortedOracles.removeExpiredReports(tokenAddress, curNumberOfReports - 1);
      }
    }
  }

  function normalizeRedstoneValueForMento(
    uint256 valueFromRedstone
  ) public pure returns (uint256) {
    return PRICE_MULTIPLIER * valueFromRedstone;
  }

  /**
   * @notice Extracts Redstone's oracle values from calldata, verifying signatures
   * and timestamps, and reports it to the SortedOracles contract
   * @param proposedRound Proposed round (should be equal to latestRound + 1)
   * @param proposedTimestamp Timestamp that should be lesser or equal to each
   * timestamp from the signed data packages in calldata
   * @param locationsInSortedLinkedLists The array of locations in linked list for reported values
   */
  function updatePriceValues(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) public {
    validateAndUpdateProposedRoundAndTimestamp(proposedRound, proposedTimestamp);

    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = getDataFeedIds();
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      bytes32 dataFeedId = dataFeedIds[dataFeedIndex];
      address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
      uint256 priceValue = normalizeRedstoneValueForMento(values[dataFeedIndex]);
      LocationInSortedLinkedList memory location = locationsInSortedLinkedLists[dataFeedIndex];

      sortedOracles.report(tokenAddress, priceValue, location.lesserKey, location.greaterKey);
    }
  }
}
