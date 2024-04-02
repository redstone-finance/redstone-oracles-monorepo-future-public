// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {RedstonePrimaryProdWithoutRoundsERC7412} from '../RedstoneERC7412.sol'; 

contract BTCFeed is RedstonePrimaryProdWithoutRoundsERC7412 {

  function getTTL() override view internal virtual returns (uint256) {
    return 3600;
  }

  function getDataFeedId() override view public virtual returns (bytes32) {
    return bytes32("BTC");
  }
}
