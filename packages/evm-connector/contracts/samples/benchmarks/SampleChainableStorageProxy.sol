// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../mocks/RedstoneConsumerNumericMock.sol";
import "./SampleChainableStorageProxyConsumer.sol";

contract SampleChainableStorageProxy is RedstoneConsumerNumericMock {
  SampleChainableStorageProxyConsumer sampleContract;
  uint8 uniqueSignersThreshold = 1;

  mapping(bytes32 => uint256) public oracleValues;

  function register(address _sampleContract) external {
    sampleContract = SampleChainableStorageProxyConsumer(_sampleContract);
  }

  function getUniqueSignersThreshold() public view override returns (uint8) {
    return uniqueSignersThreshold;
  }

  function updateUniqueSignersThreshold(uint8 newUniqueSignersThreshold) external {
    uniqueSignersThreshold = newUniqueSignersThreshold;
  }

  function processOracleValue(bytes32 dataFeedId) public {
    saveOracleValueInContractStorage(dataFeedId);
    sampleContract.processOracleValue(dataFeedId);
  }

  function processOracleValues(bytes32[] memory dataFeedIds) public {
    saveOracleValuesInContractStorage(dataFeedIds);
    sampleContract.processOracleValues(dataFeedIds);
  }

  function saveOracleValueInContractStorage(bytes32 dataFeedId) public {
    oracleValues[dataFeedId] = getOracleNumericValueFromTxMsg(dataFeedId);
  }

  function saveOracleValuesInContractStorage(bytes32[] memory dataFeedIds) public {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      oracleValues[dataFeedIds[i]] = values[i];
    }
  }

  function getOracleValue(bytes32 dataFeedId) public view returns (uint256) {
    return oracleValues[dataFeedId];
  }

  function getOracleValues(bytes32[] memory dataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory values = new uint256[](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      values[i] = oracleValues[dataFeedIds[i]];
    }
    return values;
  }
}
