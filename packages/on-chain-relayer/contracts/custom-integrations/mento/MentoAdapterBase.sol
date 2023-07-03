// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISortedOracles} from "./ISortedOracles.sol";
import {RedstoneAdapterBase} from "../../core/RedstoneAdapterBase.sol";

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
abstract contract MentoAdapterBase is RedstoneAdapterBase, Ownable {
  using EnumerableMap for EnumerableMap.UintToAddressMap;

  struct DataFeedDetails {
    bytes32 dataFeedId;
    address tokenAddress;
  }

  // RedStone provides values with 8 decimals
  // Mento sorted oracles expect 24 decimals (24 - 8 = 16)
  uint256 internal constant PRICE_MULTIPLIER = 1e16;

  // 68 = 4 (fun selector) + 32 (proposedTimestamp) + 32 (size of one array element)
  uint256 internal INITIAL_CALLDATA_OFFSET = 68;
  uint256 internal constant LOCATION_IN_SORTED_LIST_BYTE_SIZE = 64;

  ISortedOracles public sortedOracles;
  EnumerableMap.UintToAddressMap private dataFeedIdToTokenAddressMap;

  struct LocationInSortedLinkedList {
    address lesserKey;
    address greaterKey;
  }

  constructor(ISortedOracles sortedOracles_) {
    sortedOracles = sortedOracles_;
  }

  function updateSortedOraclesAddress(ISortedOracles sortedOracles_) public onlyOwner {
    sortedOracles = sortedOracles_;
  }

  /**
   * @notice Used for getting proposed values from RedStone's data packages
   * @param dataFeedIds An array of data feed identifiers
   * @return values The normalized values for corresponding data feeds
   */
  function getNormalizedOracleValuesFromTxCalldata(bytes32[] calldata dataFeedIds)
    public
    view
    returns (uint256[] memory)
  {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < values.length;) {
      values[i] = normalizeRedstoneValueForMento(values[i]);
      unchecked { i++; } // reduces gas costs
    }
    return values;
  }

  /**
   * @notice Helpful function to simplify the mento relayer implementation
   */
  function updatePriceValuesAndCleanOldReports(
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) external {
    updatePriceValues(proposedTimestamp, locationsInSortedLinkedLists);
    removeAllExpiredReports();
  }

  function removeAllExpiredReports() public {
    uint256 tokensLength = getDataFeedsCount();
    for (uint256 tokenIndex = 0; tokenIndex < tokensLength;) {
      (, address tokenAddress) = getTokenDetailsAtIndex(tokenIndex);
      uint256 curNumberOfReports = sortedOracles.numTimestamps(tokenAddress);
      if (curNumberOfReports > 0) {
        sortedOracles.removeExpiredReports(tokenAddress, curNumberOfReports - 1);
      }
      unchecked { tokenIndex++; } // reduces gas costs
    }
  }

  function normalizeRedstoneValueForMento(uint256 valueFromRedstone)
    public
    pure
    returns (uint256)
  {
    return PRICE_MULTIPLIER * valueFromRedstone;
  }

  function convertMentoValueToRedstoneValue(uint256 mentoValue) public pure returns(uint256) {
    return mentoValue / PRICE_MULTIPLIER;
  }

  /**
   * @notice Extracts Redstone's oracle values from calldata, verifying signatures
   * and timestamps, and reports it to the SortedOracles contract
   * @param proposedTimestamp Timestamp that should be lesser or equal to each
   * timestamp from the signed data packages in calldata
   * @param locationsInSortedLinkedLists The array of locations in linked list for reported values
   */
  function updatePriceValues(
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) public {
    locationsInSortedLinkedLists; // This argument is used later (extracted from calldata)
    updateDataFeedsValues(proposedTimestamp);
  }

  function _validateAndUpdateDataFeedsValues(bytes32[] memory dataFeedIds, uint256[] memory values)
    internal
    override
  {
    LocationInSortedLinkedList[]
      memory locationsInSortedList = extractLinkedListLocationsFromCalldata();
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedIds.length;) {
      bytes32 dataFeedId = dataFeedIds[dataFeedIndex];
      address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
      uint256 priceValue = normalizeRedstoneValueForMento(values[dataFeedIndex]);
      LocationInSortedLinkedList memory location = locationsInSortedList[dataFeedIndex];

      sortedOracles.report(tokenAddress, priceValue, location.lesserKey, location.greaterKey);

      unchecked { dataFeedIndex++; } // reduces gas costs
    }
  }

  function extractLinkedListLocationsFromCalldata()
    private
    view
    returns (LocationInSortedLinkedList[] memory locationsInSortedList)
  {
    uint256 calldataOffset = INITIAL_CALLDATA_OFFSET;
    uint256 arrayLength = abi.decode(
      msg.data[calldataOffset:calldataOffset + STANDARD_SLOT_BS],
      (uint256)
    );

    calldataOffset += STANDARD_SLOT_BS;

    locationsInSortedList = new LocationInSortedLinkedList[](arrayLength);
    for (uint256 i = 0; i < arrayLength;) {
      locationsInSortedList[i] = abi.decode(
        msg.data[calldataOffset:calldataOffset + LOCATION_IN_SORTED_LIST_BYTE_SIZE],
        (LocationInSortedLinkedList)
      );
      calldataOffset += LOCATION_IN_SORTED_LIST_BYTE_SIZE;
      unchecked { i++; } // reduces gas costs
    }
  }

  // Adds or updates token address for a given data feed id
  function setDataFeed(bytes32 dataFeedId, address tokenAddress) external onlyOwner {
    dataFeedIdToTokenAddressMap.set(uint256(dataFeedId), tokenAddress);
  }

  function removeDataFeed(bytes32 dataFeedId) external onlyOwner {
    dataFeedIdToTokenAddressMap.remove(uint256(dataFeedId));
  }

  function getDataFeedsCount() public view returns (uint256) {
    return dataFeedIdToTokenAddressMap.length();
  }

  function getTokenAddressByDataFeedId(bytes32 dataFeedId) public view returns (address) {
    return dataFeedIdToTokenAddressMap.get(uint256(dataFeedId));
  }

  function getDataFeedIds() public view override returns (bytes32[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = new bytes32[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount;) {
      (dataFeedIds[dataFeedIndex], ) = getTokenDetailsAtIndex(dataFeedIndex);
      unchecked { dataFeedIndex++; } // reduces gas costs
    }

    return dataFeedIds;
  }

  function getDataFeeds() public view returns (DataFeedDetails[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    DataFeedDetails[] memory dataFeeds = new DataFeedDetails[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount;) {
      (bytes32 dataFeedId, address tokenAddress) = getTokenDetailsAtIndex(dataFeedIndex);
      dataFeeds[dataFeedIndex] = DataFeedDetails({
        dataFeedId: dataFeedId,
        tokenAddress: tokenAddress
      });
      unchecked { dataFeedIndex++; } // reduces gas costs
    }
    return dataFeeds;
  }

  function getTokenDetailsAtIndex(uint256 tokenIndex)
    public
    view
    returns (bytes32 dataFeedId, address tokenAddress)
  {
    (uint256 dataFeedIdNumber, address tokenAddress_) = dataFeedIdToTokenAddressMap.at(tokenIndex);
    dataFeedId = bytes32(dataFeedIdNumber);
    tokenAddress = tokenAddress_;
  }

  // [HIGH RISK] Using this function directly may cause significant risk
  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view override returns (uint256) {
    address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
    (uint256 medianRate, ) = sortedOracles.medianRate(tokenAddress);
    return convertMentoValueToRedstoneValue(medianRate);
  }
}
