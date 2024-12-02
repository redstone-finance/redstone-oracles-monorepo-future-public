// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.17;

interface ILToken {
  function underlying() external view returns (address);
}
