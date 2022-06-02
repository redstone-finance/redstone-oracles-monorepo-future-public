// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAwareUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract MockPriceAwareUpgradeable is
  OwnableUpgradeable,
  PriceAwareUpgradeable
{
  function executeWithPrice() public view returns (uint256) {
    return getPriceFromMsg(bytes32("TSLA"));
  }
}
