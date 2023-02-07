// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/AvalancheDataServiceConsumerBase.sol";
import "./PriceFeed.sol";

contract PriceFeedsManager is AvalancheDataServiceConsumerBase {
  uint256 public lastRound = 0;
  uint256 private lastUpdateTimestampMilliseconds;
  mapping(bytes32 => PriceFeed) private priceFeedsContracts;

  bytes32[] dataFeedsIds = [
    bytes32("BTC"),
    bytes32("ETH"),
    bytes32("AVAX"),
    bytes32("USDT"),
    bytes32("USDC"),
    bytes32("BUSD"),
    bytes32("LINK"),
    bytes32("GMX"),
    bytes32("PNG"),
    bytes32("QI"),
    bytes32("JOE"),
    bytes32("YAK"),
    bytes32("PTP")
  ];

  error ProposedTimestampSmallerOrEqualToLastTimestamp(
    uint256 lastUpdateTimestampMilliseconds,
    uint256 blockTimestamp
  );

  error ProposedTimestampDoesNotMatchProposedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  constructor() {
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      priceFeedsContracts[dataFeedsIds[i]] = new PriceFeed(
        address(this),
        dataFeedsIds[i],
        string(
          abi.encodePacked("RedStone price feed for ", string(abi.encodePacked(dataFeedsIds[i])))
        )
      );
    }
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    /* 
      Here lastUpdateTimestampMilliseconds is already updated inside updateDataFeedValues
      after validation in valivalidateTimestampFromUser and equal to proposedTimestamp
    */
    if (receivedTimestampMilliseconds != lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampDoesNotMatchProposedTimestamp(
        lastUpdateTimestampMilliseconds,
        receivedTimestampMilliseconds
      );
    }
  }

  function validateProposedTimestamp(uint256 proposedTimestamp) private view {
    if (proposedTimestamp <= lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampSmallerOrEqualToLastTimestamp(
        proposedTimestamp,
        lastUpdateTimestampMilliseconds
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) private view returns (bool) {
    return proposedRound == lastRound + 1;
  }

  function getPriceFeedContractAddress(bytes32 dataFeedId) public view returns (address) {
    return address(priceFeedsContracts[dataFeedId]);
  }

  function getLastRound() public view returns (uint256) {
    return lastRound;
  }

  function getLastUpdateTimestamp() public view returns (uint256) {
    return lastUpdateTimestampMilliseconds;
  }

  function getLastRoundParams() public view returns (uint256, uint256) {
    return (lastRound, lastUpdateTimestampMilliseconds);
  }

  function updateDataFeedValues(uint256 proposedRound, uint256 proposedTimestamp) public {
    if (!isProposedRoundValid(proposedRound)) return;
    lastRound = proposedRound;
    validateProposedTimestamp(proposedTimestamp);
    lastUpdateTimestampMilliseconds = proposedTimestamp;

    /* 
      getOracleNumericValuesFromTxMsg will call validateTimestamp
      for each data package from the redstone payload 
    */
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedsIds);
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      priceFeedsContracts[dataFeedsIds[i]].storeDataFeedValue(values[i]);
    }
  }
}
