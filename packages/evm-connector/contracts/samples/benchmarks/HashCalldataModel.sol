// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../SampleRedstoneConsumerNumericMock.sol";

contract HashCalldataModel is RedstoneConsumerNumericMock {
  mapping(bytes32 => bool) public requests;
  uint256 price = 0;
  bool deleteFromStorage = false;

  function sendRequestWith3Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(abi.encodePacked(block.number, msg.sender, arg1, arg2, arg3));
    requests[requestHash] = true;
    return requestHash;
  }

  function sendRequestWith5Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(
      abi.encodePacked(block.number, msg.sender, arg1, arg2, arg3, arg4, arg5)
    );
    requests[requestHash] = true;
    return requestHash;
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
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(
      abi.encodePacked(
        block.number,
        msg.sender,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
        arg10
      )
    );
    requests[requestHash] = true;
    return requestHash;
  }
*/

  function executeRequestWith3ArgsWithPrices(
    uint256 blockNumber,
    address sender,
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3
  ) public {
    bytes32 requestHash = keccak256(abi.encodePacked(blockNumber, sender, arg1, arg2, arg3));

    bool isIn = requests[requestHash];
    if (isIn == true) {
      price = getOracleNumericValueFromTxMsg(arg1);
      if (deleteFromStorage) {
        delete requests[requestHash];
      }
    } else {
      revert("Request not found");
    }
  }

  function executeRequestWith5ArgsWithPrices(
    uint256 blockNumber,
    address sender,
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5
  ) public {
    bytes32 requestHash = keccak256(
      abi.encodePacked(blockNumber, sender, arg1, arg2, arg3, arg4, arg5)
    );

    bool isIn = requests[requestHash];
    if (isIn == true) {
      price = getOracleNumericValueFromTxMsg(arg2);
      if (deleteFromStorage) {
        delete requests[requestHash];
      }
    } else {
      revert("Request not found");
    }
  }

/** too many arguments - does not compile without optimizer enabled
  function executeRequestWith10ArgsWithPrices(
    uint256 blockNumber,
    address sender,
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
  ) public {
    bytes32 requestHash = keccak256(
      abi.encodePacked(
        blockNumber,
        sender,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
        arg10
      )
    );

    bool isIn = requests[requestHash];
    if (isIn == true) {
      price = getOracleNumericValueFromTxMsg(arg3);
      if (deleteFromStorage) {
        delete requests[requestHash];
      }
    } else {
      revert("Request not found");
    }
  }
*/

  function getUniqueSignersThreshold() public pure override returns (uint8) {
    return 3;
  }

  function setDeleteFromStorage(bool _deleteFromStorage) public {
    deleteFromStorage = _deleteFromStorage;
  }
}
