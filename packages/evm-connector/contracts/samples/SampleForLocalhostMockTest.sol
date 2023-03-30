// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleForLocalhostMockTest is RedstoneConsumerNumericMock {
  function getUniqueSignersThreshold() public pure override returns (uint8) {
    return 1;
  }

  function extractOracleValuesView(bytes32[] calldata dataFeedIds)
    external
    view
    returns (uint256[] memory)
  {
    return getOracleNumericValuesFromTxMsg(dataFeedIds);
  }
}
