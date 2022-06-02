// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../commons/PriceFeed.sol";

/***
 * It is an example of a simple defi contract that allows depositing tokens,
 * getting their current valuation and swapping between each other based on the current price
 */
contract SampleStorageBased {
  PriceFeed priceFeed;
  bool private initialized;

  bytes32[2] allowedAssets = [bytes32("ETH"), bytes32("AVAX")];

  function initialize(PriceFeed _priceFeed) external {
    require(!initialized);
    priceFeed = _priceFeed;
    initialized = true;
  }

  mapping(address => mapping(bytes32 => uint256)) balances;

  function deposit(bytes32 symbol, uint256 amount) external {
    // To check proxy in case of reverted tx
    require(amount > 0, "Amount must be greater than zero");

    balances[msg.sender][symbol] += amount;
  }

  function swap(
    bytes32 fromSymbol,
    bytes32 toSymbol,
    uint256 amount
  ) external {
    balances[msg.sender][fromSymbol] -= amount;
    balances[msg.sender][toSymbol] +=
      (amount * priceFeed.getPrice(fromSymbol)) /
      priceFeed.getPrice(toSymbol);
  }

  function balanceOf(address account, bytes32 symbol)
    external
    view
    returns (uint256)
  {
    return balances[account][symbol];
  }

  function currentValueOf(address account, bytes32 symbol)
    external
    view
    returns (uint256)
  {
    uint256 price = priceFeed.getPrice(symbol);
    return balances[account][symbol] * price;
  }

  function getCurrentTime() public view returns (uint256) {
    return block.timestamp;
  }
}
