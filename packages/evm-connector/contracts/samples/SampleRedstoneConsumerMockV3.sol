// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV3.sol";

contract SampleRedstoneConsumerMockV3 is RedstoneConsumerMockV3 {
  uint256 public latestPrice;

  function getPriceSecurely(bytes32 symbol) public view returns (uint256) {
    return getOracleValueFromTxMsg(symbol);
  }

  function saveLatestPriceInStorage(bytes32 symbol) public {
    latestPrice = getOracleValueFromTxMsg(symbol);
  }
}
