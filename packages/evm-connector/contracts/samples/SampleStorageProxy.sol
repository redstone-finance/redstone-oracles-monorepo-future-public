// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";
import "./SampleStorageProxyConsumer.sol";

contract SampleStorageProxy is RedstoneConsumerNumericMock {
  SampleStorageProxyConsumer sampleContract;

  struct SamplePoint {
    string name;
    uint256 dataValue;
  }

  struct SamplePoints {
    string [] names;
    uint256 [] dataValues;
  }

  mapping(bytes32 => uint256) public oracleValues;

  function register(address _sampleContract) external {
    sampleContract = SampleStorageProxyConsumer(_sampleContract);
  }

  function fetchStructOfArraysUsingProxyDryRun(bytes32[] memory dataFeedIds) public returns (SamplePoints memory) {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      oracleValues[dataFeedIds[i]] = values[i];
    }

    uint256[] memory ret = sampleContract.getOracleValues(dataFeedIds);
    SamplePoints memory samplePoints = SamplePoints(new string[](dataFeedIds.length), new uint256[](dataFeedIds.length));
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      samplePoints.names[i] = "sample";
      samplePoints.dataValues[i] = ret[i];
    }

    return samplePoints;
  }

  function fetchArrayOfStructsUsingProxyDryRun(bytes32[] memory dataFeedIds) public returns (SamplePoint[] memory) {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      oracleValues[dataFeedIds[i]] = values[i];
    }

    uint256[] memory ret = sampleContract.getOracleValues(dataFeedIds);
    SamplePoint[] memory samplePoints = new SamplePoint[](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      samplePoints[i] = SamplePoint("sample", ret[i]);
    }

    return samplePoints;
  }

  function fetchStructUsingProxyDryRun(bytes32 dataFeedId) public returns (SamplePoint memory) {
    oracleValues[dataFeedId] = getOracleNumericValueFromTxMsg(dataFeedId);
    uint256 value = sampleContract.getOracleValue(dataFeedId);
    return SamplePoint("sample", value);
  }

  function fetchValuesUsingProxyDryRun(bytes32[] memory dataFeedIds) public returns (uint256[] memory) {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      oracleValues[dataFeedIds[i]] = values[i];
    }
    return sampleContract.getOracleValues(dataFeedIds);
  }

  function fetchValueUsingProxyDryRun(bytes32 dataFeedId) public returns (uint256) {
    oracleValues[dataFeedId] = getOracleNumericValueFromTxMsg(dataFeedId);
    return sampleContract.getOracleValue(dataFeedId);
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
