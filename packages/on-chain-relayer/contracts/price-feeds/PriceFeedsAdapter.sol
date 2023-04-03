// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "../core/PermissionlessPriceUpdater.sol";

contract PriceFeedsAdapter is MainDemoConsumerBase, Ownable, PermissionlessPriceUpdater {
  using EnumerableSet for EnumerableSet.Bytes32Set;

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);
  error RoundNotFound(uint256 roundId);

  EnumerableSet.Bytes32Set private dataFeedsIds;

  mapping(bytes32 => mapping(uint256 => uint256)) public roundValues; // dataFeedId => (roundId => value)
  mapping(uint256 => uint256) public roundTimestamps; // roundId => timestamp

  constructor(bytes32[] memory dataFeedsIds_) {
    for (uint256 i = 0; i < dataFeedsIds_.length; i++) {
      EnumerableSet.add(dataFeedsIds, dataFeedsIds_[i]);
    }
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateDataPackageTimestampAgainstProposedTimestamp(receivedTimestampMilliseconds);
  }

  /*
    We want to update data feeds values right after adding a new one.
    This is because without it someone could get the value of the newly
    added data feed before updating the value when it is still zero.
  */
  function addDataFeedIdAndUpdateValues(
    bytes32 newDataFeedId,
    uint256 proposedTimestamp
  ) public onlyOwner {
    EnumerableSet.add(dataFeedsIds, newDataFeedId);
    updateDataFeedsValues(getLastRound() + 1, proposedTimestamp);
  }

  function getDataFeedsIds() public view returns (bytes32[] memory) {
    return dataFeedsIds._inner._values;
  }

  function updateDataFeedsValues(uint256 proposedRound, uint256 proposedTimestamp) public {
    validateAndUpdateProposedRoundAndTimestamp(proposedRound, proposedTimestamp);

    /* 
      getOracleNumericValuesFromTxMsg will call validateTimestamp
      for each data package from the redstone payload 
    */
    bytes32[] memory dataFeedsIdsArray = getDataFeedsIds();
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);
    for (uint256 i = 0; i < dataFeedsIdsArray.length; i++) {
      bytes32 dataFeedId = dataFeedsIdsArray[i];
      roundValues[dataFeedId][proposedRound] = values[i];
    }
    roundTimestamps[proposedRound] = proposedTimestamp;
  }

  function getValueForDataFeed(bytes32 dataFeedId) public view returns (uint256) {
    uint256 lastRound = getLastRound();
    uint256 dataFeedValue = roundValues[dataFeedId][lastRound];
    if (dataFeedValue == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
    return dataFeedValue;
  }

  function getValueForDataFeedAndLastRoundParams(
    bytes32 dataFeedId
  )
    public
    view
    returns (
      uint256 dataFeedValue,
      uint256 lastRoundNumber,
      uint256 lastUpdateTimestampInMilliseconds
    )
  {
    lastRoundNumber = getLastRound();
    (dataFeedValue, lastUpdateTimestampInMilliseconds) = getRoundData(dataFeedId, lastRoundNumber);
  }

  function getRoundData(
    bytes32 dataFeedId,
    uint256 roundNumber
  ) public view returns (uint256 dataFeedValue, uint256 roundTimestampInMilliseconds) {
    if (roundNumber > getLastRound() || roundNumber == 0) {
      revert RoundNotFound(roundNumber);
    }
    dataFeedValue = roundValues[dataFeedId][roundNumber];
    roundTimestampInMilliseconds = roundTimestamps[roundNumber];
  }

  function getValuesForDataFeeds(
    bytes32[] memory requestedDataFeedsIds
  ) public view returns (uint256[] memory) {
    uint256[] memory values = new uint256[](requestedDataFeedsIds.length);
    for (uint256 i = 0; i < requestedDataFeedsIds.length; i++) {
      values[i] = getValueForDataFeed(requestedDataFeedsIds[i]);
    }
    return (values);
  }
}
