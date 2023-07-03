// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SinglePriceFeedAdapterMock} from "../mocks/SinglePriceFeedAdapterMock.sol";

contract SinglePriceFeedAdapterBenchmark is SinglePriceFeedAdapterMock {
  function getAllowedTimestampDiffsInSeconds() public pure override returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = 20 minutes;
    maxDataDelaySeconds = 20 minutes;
  }
}
