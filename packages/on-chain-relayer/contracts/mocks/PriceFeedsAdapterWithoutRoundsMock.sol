// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {PriceFeedsAdapterWithoutRounds} from "../price-feeds/without-rounds/PriceFeedsAdapterWithoutRounds.sol";

contract PriceFeedsAdapterWithoutRoundsMock is PriceFeedsAdapterWithoutRounds, AuthorisedMockSignersBase {
  function getDataFeedIds() public pure virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = bytes32("BTC");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    return getAuthorisedMockSignerIndex(signerAddress);
  }
}
