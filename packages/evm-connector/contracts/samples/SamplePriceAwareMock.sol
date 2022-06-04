// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/PriceAwareMock.sol";

contract SamplePriceAwareMock is PriceAwareMock {
  uint256 public latestEthPrice;

  function getEthPriceSecurely() public view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }

  function saveLatestEthPriceInStorage() public {
    latestEthPrice = getPriceFromMsg(bytes32("ETH"));
  }
}
