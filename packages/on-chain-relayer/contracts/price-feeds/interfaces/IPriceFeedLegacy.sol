// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

/**
 * @title Interface with the old Chainlink Price Feed functions
 * @author The Redstone Oracles team
 * @dev There are some projects (e.g. gmx-contracts) that still
 * rely on some legacy functions
 */
interface IPriceFeedLegacy {
  /**
   * @notice Old Chainlink function for getting the number of latest round
   * @return latestRound The number of the latest update round
   */
  function latestRound() external view returns (uint80);

  
  /**
   * @notice Old Chainlink function for getting the latest successfully reported value
   * @return latestAnswer The latest successfully reported value
   */
  function latestAnswer() external view returns (int256);
}
