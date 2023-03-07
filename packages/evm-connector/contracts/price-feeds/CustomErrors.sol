// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library CustomErrors {
  error UseLatestRoundToGetDataFeedPrice();

  error ProposedTimestampSmallerOrEqualToLastTimestamp(
    uint256 lastUpdateTimestampInMilliseconds,
    uint256 blockTimestamp
  );

  error ProposedTimestampDoesNotMatchReceivedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);
}
