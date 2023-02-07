// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../SampleRedstoneConsumerNumericMock.sol";

contract SampleProxyConnectorConsumer is SampleRedstoneConsumerNumericMock {
  uint256 computation_result = 0;
  uint8 uniqueSignersThreshold = 1;

  function getUniqueSignersThreshold() public view override returns (uint8) {
    return uniqueSignersThreshold;
  }

  function updateUniqueSignersThreshold(uint8 newUniqueSignersThreshold) external {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function processOracleValue(bytes32 dataFeedId) public {
    uint256 value = getOracleNumericValueFromTxMsg(dataFeedId);
    computation_result += 42 * value;
  }

  function processOracleValues(bytes32[] memory dataFeedIds) public {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      computation_result += 42 * values[i];
    }
  }

  function getComputationResult() external view returns (uint256) {
    return computation_result;
  }
}
