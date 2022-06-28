// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV4.sol";
import "../commons/NumericArrayLib.sol";
import "hardhat/console.sol";

contract SampleRedstoneConsumerMockV4Strings is RedstoneConsumerMockV4 {
  bytes public latestString;

  function saveLatestValueInStorage(bytes32 symbol) public {
    bytes memory bytesValueFromOracle = getOracleValueFromTxMsg(symbol);
    latestString = bytesValueFromOracle;
  }
}
