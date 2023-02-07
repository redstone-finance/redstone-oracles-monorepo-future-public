// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./SampleStorageProxy.sol";

contract SampleStorageProxyConsumer {
  error UnexpectedOracleValue();

  SampleStorageProxy storageProxy;

  constructor(address _sampleStorageProxy) {
    storageProxy = SampleStorageProxy(_sampleStorageProxy);
  }

  function checkOracleValues(bytes32[] memory dataFeedIds, uint256[] memory expectedValues)
    external
    view
  {
    uint256[] memory values = storageProxy.getOracleValues(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      if (values[i] != expectedValues[i]) {
        revert UnexpectedOracleValue();
      }
    }
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 value = storageProxy.getOracleValue(dataFeedId);
    if (value != expectedValue) {
      revert UnexpectedOracleValue();
    }
  }

  function getOracleValue(bytes32 dataFeedId) public view returns (uint256) {
    return storageProxy.getOracleValue(dataFeedId);
  }

  function getOracleValues(bytes32[] memory dataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory dataValues = new uint256[](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      dataValues[i] = storageProxy.getOracleValue(dataFeedIds[i]);
    }
    return dataValues;
  }
}
