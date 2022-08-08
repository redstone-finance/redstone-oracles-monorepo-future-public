// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleRedstoneConsumerNumericMockManyDataFeeds is RedstoneConsumerNumericMock {
  uint256 public firstValue;
  uint256 public secondValue;

  function save2ValuesInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }
}
