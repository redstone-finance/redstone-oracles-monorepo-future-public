// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleRedstoneConsumerNumericMock is RedstoneConsumerNumericMock {
  uint256 public latestSavedValue;

  function getValueForDataFeedId(bytes32 dataFeedId) public view returns (uint256) {
    return getOracleNumericValueFromTxMsg(dataFeedId);
  }

  function saveOracleValueInContractStorage(bytes32 dataFeedId) public {
    latestSavedValue = getOracleNumericValueFromTxMsg(dataFeedId);
  }
}
