// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedBase, PriceFeedWithRounds} from "./PriceFeedWithRounds.sol";
import {PriceFeedsAdapterBase, PriceFeedsAdapterWithRounds} from "./PriceFeedsAdapterWithRounds.sol";
import {IRedstoneAdapter} from "../../core/IRedstoneAdapter.sol";
import {MergedPriceFeedAdapterCommon} from "../MergedPriceFeedAdapterCommon.sol";

abstract contract MergedPriceFeedAdapterWithRounds is
  MergedPriceFeedAdapterCommon,
  PriceFeedWithRounds,
  PriceFeedsAdapterWithRounds
{
  function initialize() public override(PriceFeedBase, PriceFeedsAdapterBase) initializer {}

  function getPriceFeedAdapter() public view override(MergedPriceFeedAdapterCommon, PriceFeedBase) returns (IRedstoneAdapter) {
    return super.getPriceFeedAdapter();
  }

  function getDataFeedIds() public view override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = getSingleDataFeedId();
  }

  function getDataFeedId() public view override returns (bytes32) {
    return getSingleDataFeedId();
  }

  function getDataFeedIndex(bytes32 dataFeedId) public view override returns (uint256) {
    if (dataFeedId == getDataFeedId()) {
      return 0;
    }
    revert DataFeedIdNotFound(dataFeedId);
  }
}
