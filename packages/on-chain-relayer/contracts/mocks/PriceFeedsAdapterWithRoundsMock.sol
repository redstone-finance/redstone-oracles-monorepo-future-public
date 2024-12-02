// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.17;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {PriceFeedsAdapterWithRounds} from "../price-feeds/with-rounds/PriceFeedsAdapterWithRounds.sol";

contract PriceFeedsAdapterWithRoundsMock is PriceFeedsAdapterWithRounds, AuthorisedMockSignersBase {
  function getDataFeedIds() public  virtual pure override returns (bytes32[] memory dataFeedIds) {
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
