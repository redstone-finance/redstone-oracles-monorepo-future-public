// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {EthUsdcRedstoneAdapterForFluidOracle} from "../custom-integrations/fluid/EthUsdcRedstoneAdapterForFluidOracle.sol";
import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {PriceFeedsAdapterWithoutRounds} from "../price-feeds/without-rounds/PriceFeedsAdapterWithoutRounds.sol";

contract FluidOracleRedstoneAdapterMock is EthUsdcRedstoneAdapterForFluidOracle,AuthorisedMockSignersBase {
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