// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract Benchmark is RedstoneConsumerMock {
  function updateUniqueSignersThreshold(uint256 newUniqueSignersThreshold) public {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function saveLatestValueInStorage(bytes32[] calldata symbols) public {
    uint256[] memory values = getOracleValuesFromTxMsg(symbols);
    values;
  }

  // `emptySaveLatestValueInStorage` is used to calculate gas costs for pure
  // calling the function and calculate the exact gas costs for getting
  // the oracle values
  function emptySaveLatestValueInStorage(bytes32[] calldata symbols) public {
    uint256[] memory values;
    values;
  }
}
