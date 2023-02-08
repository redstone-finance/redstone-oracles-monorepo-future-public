// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/AvalancheDataServiceConsumerBase.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./PriceFeedsRegistry.sol";
import "./PriceFeed.sol";

contract PriceFeedsManager is AvalancheDataServiceConsumerBase, Initializable {
  uint256 public lastRound = 0;
  uint256 public lastUpdateTimestampMilliseconds = 0;
  PriceFeedsRegistry public priceFeedRegistry;

  error ProposedTimestampSmallerOrEqualToLastTimestamp(
    uint256 lastUpdateTimestampMilliseconds,
    uint256 blockTimestamp
  );

  error ProposedTimestampDoesNotMatchReceivedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  function initialize(address priceFeedsRegistryAddress) public initializer {
    priceFeedRegistry = PriceFeedsRegistry(priceFeedsRegistryAddress);
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    /* 
      Here lastUpdateTimestampMilliseconds is already updated inside updateDataFeedValues
      after validation in valivalidateTimestampFromUser and equal to proposedTimestamp
    */
    if (receivedTimestampMilliseconds != lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampDoesNotMatchReceivedTimestamp(
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
    bytes32[] memory dataFeedsIds = priceFeedRegistry.getDataFeeds();
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedsIds);
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      PriceFeed(priceFeedRegistry.getPriceFeedContractAddress(dataFeedsIds[i])).storeDataFeedValue(
          values[i]
        );
    }
  }
}
