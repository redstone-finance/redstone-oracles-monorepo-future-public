// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IPriceFeedLegacy} from "./IPriceFeedLegacy.sol";

/**
 * @title Complete price feed interface
 * @author The Redstone Oracles team
 * @dev All required public functions that must be implemented
 * by each Redstone PriceFeed contract
 */
interface IPriceFeed is IPriceFeedLegacy, AggregatorV3Interface {
  /**
   * @notice Returns data feed identifier for the PriceFeed contract
   * @return dataFeedId The identifier of the data feed
   */
  function getDataFeedId() external view returns (bytes32);
}
