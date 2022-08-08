// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerBytesMock.sol";

contract SampleRedstoneConsumerBytesMockManyDataFeeds is RedstoneConsumerBytesMock {
  bytes public firstValue;
  bytes public secondValue;

  function save2ValuesInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    bytes[] memory values = getOracleBytesValuesFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }
}
