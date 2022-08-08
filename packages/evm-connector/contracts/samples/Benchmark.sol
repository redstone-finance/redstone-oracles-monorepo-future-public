// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract Benchmark is RedstoneConsumerNumericMock {
  function updateUniqueSignersThreshold(uint256 newUniqueSignersThreshold) external {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function extractOracleValues(bytes32[] calldata dataFeedIds) external {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    values;
  }

  // `emptyExtractOracleValues` is used to calculate gas costs for pure
  // calling the function and calculate the exact gas costs for getting
  // the oracle values
  function emptyExtractOracleValues(bytes32[] calldata dataFeedIds) external {
    dataFeedIds;
    uint256[] memory values;
    values;
  }

  function getAuthorisedMockSignerIndex(address _signerAddress)
    public
    view
    override
    returns (uint256)
  {
    return getAllMockAuthorised(_signerAddress);
  }
}
