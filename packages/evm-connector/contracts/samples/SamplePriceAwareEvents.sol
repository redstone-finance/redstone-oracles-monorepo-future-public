// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/PriceAwareMock.sol";

contract SamplePriceAwareEvents is PriceAwareMock {
  event PriceUpdated(uint256 _ethPrice);

  function emitEventWithLatestEthPrice() public {
    uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
    emit PriceUpdated(ethPrice);
  }
}
