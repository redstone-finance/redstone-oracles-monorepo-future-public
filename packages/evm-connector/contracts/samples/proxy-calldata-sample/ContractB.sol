// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../mocks/PriceAwareMock.sol";

contract ContractB is PriceAwareMock {
  uint256 private lastValue = 0;

  function writeValue() public {
    uint256 tslaPrice = getPriceFromMsg(bytes32("TSLA"));
    lastValue = tslaPrice;
  }

  function getValue() public view returns (uint256) {
    uint256 result = getPriceFromMsg(bytes32("TSLA"));
    return result;
  }
}
