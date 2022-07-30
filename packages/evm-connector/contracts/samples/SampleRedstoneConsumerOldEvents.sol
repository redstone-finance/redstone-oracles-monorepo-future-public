// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerOldMock.sol";

contract SampleRedstoneConsumerOldEvents is RedstoneConsumerOldMock {
  event PriceUpdated(uint256 _ethPrice);

  function emitEventWithLatestEthPrice() public {
    uint256 ethPrice = getOracleNumericValueFromTxMsg(bytes32("ETH"));
    emit PriceUpdated(ethPrice);
  }
}
