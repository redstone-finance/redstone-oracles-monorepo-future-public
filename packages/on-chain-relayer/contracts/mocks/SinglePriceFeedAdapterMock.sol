// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {SinglePriceFeedAdapter} from "../price-feeds/without-rounds/SinglePriceFeedAdapter.sol";

contract SinglePriceFeedAdapterMock is SinglePriceFeedAdapter, AuthorisedMockSignersBase {
  function getDataFeedId() public pure override returns (bytes32) {
    return bytes32("BTC");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }
}
