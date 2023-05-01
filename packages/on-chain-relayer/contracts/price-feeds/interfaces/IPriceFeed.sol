// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IPriceFeedLegacy.sol";

interface IPriceFeed is IPriceFeedLegacy, AggregatorV3Interface {
  function getDataFeedId() external view returns (bytes32);
}
