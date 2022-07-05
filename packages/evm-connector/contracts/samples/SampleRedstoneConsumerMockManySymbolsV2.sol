// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV2.sol";

contract SampleRedstoneConsumerMockManySymbolsV2 is RedstoneConsumerMockV2 {
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
