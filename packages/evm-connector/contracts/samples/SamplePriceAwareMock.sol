// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/PriceAwareMock.sol";

contract SamplePriceAwareMock is PriceAwareMock {
  function getEthPriceSecurely() public view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }
}
