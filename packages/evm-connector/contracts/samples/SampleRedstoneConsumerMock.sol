// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract SampleRedstoneConsumerMock is RedstoneConsumerMock {
  uint256 public latestEthPrice;

  function getValueForDataFeedId(bytes32 dataFeedId) public view returns (uint256) {
    return getOracleNumericValueFromTxMsg(dataFeedId);
  }

  function getEthPriceSecurely() public view returns (uint256) {
    return getOracleNumericValueFromTxMsg(bytes32("ETH"));
  }

  function saveLatestEthPriceInStorage() public {
    latestEthPrice = getOracleNumericValueFromTxMsg(bytes32("ETH"));
  }
}
