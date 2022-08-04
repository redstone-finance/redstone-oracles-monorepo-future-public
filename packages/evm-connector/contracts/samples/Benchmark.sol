// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract Benchmark is RedstoneConsumerMock {
  function updateUniqueSignersThreshold(uint256 newUniqueSignersThreshold) public {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function extractOracleValues(bytes32[] calldata symbols) public {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(symbols);
    values;
  }

  // `emptyExtractOracleValues` is used to calculate gas costs for pure
  // calling the function and calculate the exact gas costs for getting
  // the oracle values
  function emptyExtractOracleValues(bytes32[] calldata symbols) public {
    symbols;
    uint256[] memory values;
    values;
  }
}
