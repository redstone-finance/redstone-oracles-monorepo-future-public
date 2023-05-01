// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

// There are some projects (e.g. gmx-contracts) that still rely on some legacy functions
interface IPriceFeedLegacy {
  function latestRound() external view returns (uint80);

  function latestAnswer() external view returns (int256);
}
