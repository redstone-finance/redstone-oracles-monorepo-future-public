// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import "../price-feeds/with-rounds/PriceFeedsAdapterWithRounds.sol";

contract PriceFeedsAdapterUpdatedMock is PriceFeedsAdapterWithRounds, AuthorisedMockSignersBase {
  function getDataFeedIds() public pure virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](2);
    dataFeedIds[0] = bytes32("ETH");
    dataFeedIds[1] = bytes32("BTC");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return 0;
  }
}
