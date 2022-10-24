// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RedstoneToken
 * @dev Standard implementation of ERC20 for Redstone token
 */
contract RedstoneToken is ERC20 {
  constructor(uint256 initialSupply) ERC20("Redstone", "REDSTONE") {
    _mint(msg.sender, initialSupply);
  }
}
