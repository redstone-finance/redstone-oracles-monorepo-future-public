// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract SampleRedstoneConsumerMockManySymbols is RedstoneConsumerMock {
  uint256 public firstValue;
  uint256 public secondValue;

  function save2ValuesInStorage(bytes32[] calldata symbols) public {
    // Get oracle values
    uint256[] memory values = getOracleValuesFromTxMsg(symbols);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }
}
