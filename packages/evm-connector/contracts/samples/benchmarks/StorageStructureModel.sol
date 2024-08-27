// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../SampleRedstoneConsumerNumericMock.sol";

contract StorageStructureModel is RedstoneConsumerNumericMock {
  uint256 counter = 0;
  uint256 price = 0;
  bool deleteFromStorage = false;

  mapping(uint256 => RequestWith3Args) public requestsWith3Args;
  mapping(uint256 => RequestWith5Args) public requestsWith5Args;
  mapping(uint256 => RequestWith10Args) public requestsWith10Args;

  struct RequestWith3Args {
    bytes32 arg1;
    bytes32 arg2;
    bytes32 arg3;
    uint256 blockNumber;
    address requesterAddress;
  }

  struct RequestWith5Args {
    bytes32 arg1;
    bytes32 arg2;
    bytes32 arg3;
    bytes32 arg4;
    bytes32 arg5;
    uint256 blockNumber;
    address requesterAddress;
  }

  struct RequestWith10Args {
    bytes32 arg1;
    bytes32 arg2;
    bytes32 arg3;
    bytes32 arg4;
    bytes32 arg5;
    bytes32 arg6;
    bytes32 arg7;
    bytes32 arg8;
    bytes32 arg9;
    bytes32 arg10;
    uint256 blockNumber;
    address requesterAddress;
  }

  function sendRequestWith3Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3
  ) public returns (uint256) {
    counter++;
    requestsWith3Args[counter] = RequestWith3Args(arg1, arg2, arg3, block.number, msg.sender);
    return counter;
  }

  function sendRequestWith5Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5
  ) public returns (uint256) {
    counter++;
    requestsWith5Args[counter] = RequestWith5Args(
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      block.number,
      msg.sender
    );
    return counter;
  }

/** too many arguments - does not compile without optimizer enabled
  function sendRequestWith10Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5,
    bytes32 arg6,
    bytes32 arg7,
    bytes32 arg8,
    bytes32 arg9,
    bytes32 arg10
  ) public returns (uint256) {
    counter++;
    requestsWith10Args[counter] = RequestWith10Args(
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
      arg7,
      arg8,
      arg9,
      arg10,
      block.number,
      msg.sender
    );
    return counter;
  }
*/

  function executeRequestWith3ArgsWithPrices(uint256 requestId) public {
    RequestWith3Args storage request = requestsWith3Args[requestId];
    price = getOracleNumericValueFromTxMsg(request.arg1);
    if (deleteFromStorage) {
      delete requestsWith3Args[requestId];
    }
  }

  function executeRequestWith5ArgsWithPrices(uint256 requestId) public {
    RequestWith5Args storage request = requestsWith5Args[requestId];
    price = getOracleNumericValueFromTxMsg(request.arg2);
    if (deleteFromStorage) {
      delete requestsWith5Args[requestId];
    }
  }

  function executeRequestWith10ArgsWithPrices(uint256 requestId) public {
    RequestWith10Args storage request = requestsWith10Args[requestId];
    price = getOracleNumericValueFromTxMsg(request.arg3);
    if (deleteFromStorage) {
      delete requestsWith10Args[requestId];
    }
  }

  function getUniqueSignersThreshold() public pure override returns (uint8) {
    return 3;
  }

  function setDeleteFromStorage(bool _deleteFromStorage) public {
    deleteFromStorage = _deleteFromStorage;
  }
}
