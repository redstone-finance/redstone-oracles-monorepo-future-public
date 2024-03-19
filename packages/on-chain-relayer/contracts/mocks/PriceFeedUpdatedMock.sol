// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedWithRounds} from "../price-feeds/with-rounds/PriceFeedWithRounds.sol";
import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";

contract PriceFeedUpdatedMock is PriceFeedWithRounds {
  IRedstoneAdapter private adapterAddress;

  function setAdapterAddress(IRedstoneAdapter _adapterAddress) public {
    adapterAddress = _adapterAddress;
  }

  function getDataFeedId() public view virtual override returns (bytes32) {
    return bytes32("ETH");
  }

  function getPriceFeedAdapter() public view virtual override returns (IRedstoneAdapter) {
    return IRedstoneAdapter(0x2C31d00C1AE878F28c58B3aC0672007aECb4A124);
  }
}
