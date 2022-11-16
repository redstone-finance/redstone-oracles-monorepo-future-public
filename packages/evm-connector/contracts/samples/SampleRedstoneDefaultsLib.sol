// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneDefaultsLib.sol";

contract SampleRedstoneDefaultsLib {
  function validateTimestamp(uint256 receivedTimestampMilliseconds) external view {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
  }

  function aggregateValues(uint256[] memory values) external pure returns (uint256) {
    return RedstoneDefaultsLib.aggregateValues(values);
  }
}
