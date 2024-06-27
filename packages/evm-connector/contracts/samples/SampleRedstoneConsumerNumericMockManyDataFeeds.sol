// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleRedstoneConsumerNumericMockManyDataFeeds is RedstoneConsumerNumericMock {
  uint256 public firstValue;
  uint256 public secondValue;
  uint256 public timestampFromData;

  function save2ValuesInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }

  function save2ValuesAndTimestampInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    (uint256[] memory values, uint256 _timestampFromData) = getOracleNumericValuesAndTimestampFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
    timestampFromData = _timestampFromData;
  }

  function save2ValuesInStorageWithManualPayload(
    bytes32[] calldata dataFeedIds,
    bytes calldata
  ) public {
    save2ValuesInStorage(dataFeedIds);
  }
}
