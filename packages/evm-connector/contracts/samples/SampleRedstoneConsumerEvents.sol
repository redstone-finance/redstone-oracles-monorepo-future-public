// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMock.sol";

contract SampleRedstoneConsumerEvents is RedstoneConsumerMock {
  event PriceUpdated(uint256 _ethPrice);

  function emitEventWithLatestEthPrice() public {
    uint256 ethPrice = getOracleValueFromTxMsg(bytes32("ETH"));
    emit PriceUpdated(ethPrice);
  }
}
