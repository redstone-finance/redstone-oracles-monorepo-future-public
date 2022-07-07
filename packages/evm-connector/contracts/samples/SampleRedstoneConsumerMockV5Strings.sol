// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV5.sol";
import "../commons/NumericArrayLib.sol";
import "hardhat/console.sol";

contract SampleRedstoneConsumerMockV5Strings is RedstoneConsumerMockV5 {
  bytes public latestString;

  function saveLatestValueInStorage(bytes32 symbol) public {
    bytes memory bytesValueFromOracle = getOracleBytesValueFromTxMsg(symbol);
    latestString = bytesValueFromOracle;
  }
}
