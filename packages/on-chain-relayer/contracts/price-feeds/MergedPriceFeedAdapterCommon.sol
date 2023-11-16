// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;
import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract MergedPriceFeedAdapterCommon {
  event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);

  error CannotUpdateMoreThanOneDataFeed();

  function getPriceFeedAdapter() public view virtual returns (IRedstoneAdapter) {
    return IRedstoneAdapter(address(this));
  }

  function aggregator() public view virtual returns (address) {
    return address(getPriceFeedAdapter());
  }
}
