// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../price-feeds/without-rounds/PriceFeedWithoutRounds.sol";

contract PriceFeedWithoutRoundsMock is PriceFeedWithoutRounds {
  IRedstoneAdapter private adapterAddress;

  function setAdapterAddress(IRedstoneAdapter _adapterAddress) public {
    adapterAddress = _adapterAddress;
  }

  function getDataFeedId() public view virtual override returns (bytes32) {
    return bytes32("BTC");
  }

  function getPriceFeedAdapter() public view virtual override returns (IRedstoneAdapter) {
    return adapterAddress;
  }
}
