// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleDuplicatedDataFeeds is RedstoneConsumerNumericMock {
  uint256[] internal valuesInStorage;

  function getValuesFromStorage() external view returns (uint256[] memory) {
    return valuesInStorage;
  }

  function saveOracleValuesInStorage(bytes32[] calldata dataFeedIdsWithDuplicates) public {
    // Get oracle values
    uint256[] memory values = getOracleNumericValuesWithDuplicatesFromTxMsg(
      dataFeedIdsWithDuplicates
    );

    // Save values in contract state
    valuesInStorage = values;
  }
}
