// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV2Assembly.sol";

contract SampleRedstoneConsumerMockV2Assembly is RedstoneConsumerMockV2Assembly {
  uint256 public latestEthPrice;

  function getEthPriceSecurely() public view returns (uint256) {
    return getOracleValueFromTxMsg(bytes32("ETH"));
  }

  function saveLatestEthPriceInStorage() public {
    latestEthPrice = getOracleValueFromTxMsg(bytes32("ETH"));
  }
}
