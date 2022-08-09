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

  function getValueManyParams(
    bytes32 dataFeedId,
    uint256 mockArg1,
    string memory mockArg2,
    string memory mockArg3,
    string memory mockArg4,
    string memory mockArg5,
    string memory mockArg6
  ) public view returns (uint256) {
    // This is added to avoid warnings about unused arguments
    mockArg1;
    mockArg2;
    mockArg3;
    mockArg4;
    mockArg5;
    mockArg6;
    return getOracleNumericValueFromTxMsg(dataFeedId);
  }

  function returnMsgValue() external payable returns (uint256) {
    return msg.value;
  }
}
