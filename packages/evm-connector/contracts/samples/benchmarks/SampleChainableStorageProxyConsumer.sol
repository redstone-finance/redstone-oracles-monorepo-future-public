// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../SampleStorageProxy.sol";

contract SampleChainableStorageProxyConsumer {
  error UnexpectedOracleValue();

  SampleStorageProxy storageProxy;
  SampleChainableStorageProxyConsumer nextContract;
  uint256 computation_result = 0;

  constructor(address _sampleStorageProxy) {
    storageProxy = SampleStorageProxy(_sampleStorageProxy);
  }

  function register(address _nextContract) external {
    nextContract = SampleChainableStorageProxyConsumer(_nextContract);
  }

  function processOracleValue(bytes32 dataFeedId) external {
    if (address(nextContract) != address(0)) {
      nextContract.processOracleValue(dataFeedId);
      return;
    }

    uint256 value = storageProxy.getOracleValue(dataFeedId);
    computation_result += 42 * value;
  }

  function processOracleValues(bytes32[] memory dataFeedIds) external {
    if (address(nextContract) != address(0)) {
      nextContract.processOracleValues(dataFeedIds);
      return;
    }

    uint256[] memory values = storageProxy.getOracleValues(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      computation_result += 42 * values[i];
    }
  }

  function getComputationResult() external view returns (uint256) {
    return computation_result;
  }
}
