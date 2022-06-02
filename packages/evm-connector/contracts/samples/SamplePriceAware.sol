// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAwareOwnable.sol";

/**
 * @title SamplePriceAware
 * @dev An example of a contract using a message-based way of fetching data from RedStone
 * It has only a few methods used to benchmark gas consumption
 * It extends PriceAware and allows changing trusted signer and message delay
 */
contract SamplePriceAware is PriceAwareOwnable {

  uint256 lastPrice;

  function getPrice(bytes32 asset) external view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrice(bytes32 asset) public returns (uint256) {
    lastPrice = getPriceFromMsg(asset);
    return lastPrice;
  }

  function executeWithPrices(bytes32[] memory assets) public view returns (uint256[] memory) {
    return getPricesFromMsg(assets);
  }

  // For ProxyConnector tests
  function getPriceManyParameters (
    bytes32 asset,
    uint256 mockArg1,
    string memory mockArg2,
    string memory mockArg3,
    string memory mockArg4,
    string memory mockArg5,
    string memory mockArg6
  ) external view returns (uint256) {
    // This is added to avoid warnings about unused arguments
    mockArg1; mockArg2; mockArg3; mockArg4; mockArg5; mockArg6;
    return getPriceFromMsg(asset);
  }

  function a() external view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }

  function returnMsgValue() external payable returns (uint256) {
    return msg.value;
  }
}
