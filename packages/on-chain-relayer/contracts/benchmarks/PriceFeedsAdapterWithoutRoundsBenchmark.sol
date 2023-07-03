// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterWithoutRoundsMock} from "../mocks/PriceFeedsAdapterWithoutRoundsMock.sol";

contract PriceFeedsAdapterWithoutRoundsBenchmark is PriceFeedsAdapterWithoutRoundsMock {
  function getAllowedTimestampDiffsInSeconds() public pure override returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = 20 minutes;
    maxDataDelaySeconds = 20 minutes;
  }
}
