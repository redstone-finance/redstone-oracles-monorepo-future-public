// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../mocks/PriceFeedsAdapterWithRoundsMock.sol";

contract PriceFeedsAdapterWithRoundsBenchmark is PriceFeedsAdapterWithRoundsMock {
  function getAllowedTimestampDiffsInSeconds() public pure override returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = 20 minutes;
    maxDataDelaySeconds = 20 minutes;
  }
}
