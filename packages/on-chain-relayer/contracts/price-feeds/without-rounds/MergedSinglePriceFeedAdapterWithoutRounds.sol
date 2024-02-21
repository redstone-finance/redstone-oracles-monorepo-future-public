// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {SinglePriceFeedAdapter} from "./SinglePriceFeedAdapter.sol";
import {PriceFeedsAdapterBase} from "./PriceFeedsAdapterWithoutRounds.sol";
import {PriceFeedBase, PriceFeedWithoutRounds} from "./PriceFeedWithoutRounds.sol";
import {IRedstoneAdapter} from "../../core/IRedstoneAdapter.sol";
import {MergedPriceFeedAdapterCommon} from "../MergedPriceFeedAdapterCommon.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract MergedSinglePriceFeedAdapterWithoutRounds is
  MergedPriceFeedAdapterCommon,
  SinglePriceFeedAdapter,
  PriceFeedWithoutRounds
{

  function getDataFeedId() public view virtual override(SinglePriceFeedAdapter, PriceFeedBase) returns (bytes32);

  function initialize() public override(PriceFeedBase, PriceFeedsAdapterBase) initializer {
    // We don't have storage variables, but we keep this function
    // Because it is used for contract setup in upgradable contracts
  }

  function getPriceFeedAdapter() public view virtual override(MergedPriceFeedAdapterCommon, PriceFeedBase) returns (IRedstoneAdapter) {
    return super.getPriceFeedAdapter();
  }

  function _emitEventAfterSingleValueUpdate(uint256 newValue) internal virtual {
    emit AnswerUpdated(SafeCast.toInt256(newValue), latestRound(), block.timestamp);
  }

  function _validateAndUpdateDataFeedsValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual override {
    if (dataFeedIdsArray.length != 1 || values.length != 1) {
      revert CannotUpdateMoreThanOneDataFeed();
    }
    _validateAndUpdateDataFeedValue(dataFeedIdsArray[0], values[0]);
    _emitEventAfterSingleValueUpdate(values[0]);
  }
}
