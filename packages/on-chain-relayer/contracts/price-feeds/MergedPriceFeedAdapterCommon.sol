// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;
import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";
import {IMergedPriceFeedAdapterCommon} from "./interfaces/IMergedPriceFeedAdapter.sol";

abstract contract MergedPriceFeedAdapterCommon is IMergedPriceFeedAdapterCommon {
  function getSingleDataFeedId() public view virtual returns (bytes32);

  function getPriceFeedAdapter() public view virtual returns (IRedstoneAdapter) {
    return IRedstoneAdapter(address(this));
  }
}
