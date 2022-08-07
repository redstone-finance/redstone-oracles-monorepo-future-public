// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library NumbersLib {
  uint256 constant BITS_COUNT_IN_16_BYTES = 128;

  function getNumberFromFirst16Bytes(uint256 number) internal pure returns (uint256) {
    return uint256(number >> BITS_COUNT_IN_16_BYTES);
  }

  function getNumberFromLast16Bytes(uint256 number) internal pure returns (uint256) {
    return uint256((number << BITS_COUNT_IN_16_BYTES) >> BITS_COUNT_IN_16_BYTES);
  }
}
