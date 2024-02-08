// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

interface ILToken {
  function underlying() external view returns (address);
}
