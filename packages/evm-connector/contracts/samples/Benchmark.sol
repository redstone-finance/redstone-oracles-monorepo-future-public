// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract Benchmark is RedstoneConsumerMock {
  function updateUniqueSignersThreshold(uint256 newUniqueSignersThreshold) public {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function extractOracleValues(bytes32[] calldata dataFeedIds) public {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    values;
  }

  // `emptyExtractOracleValues` is used to calculate gas costs for pure
  // calling the function and calculate the exact gas costs for getting
  // the oracle values
  function emptyExtractOracleValues(bytes32[] calldata dataFeedIds) public {
    dataFeedIds;
    uint256[] memory values;
    values;
  }
}
