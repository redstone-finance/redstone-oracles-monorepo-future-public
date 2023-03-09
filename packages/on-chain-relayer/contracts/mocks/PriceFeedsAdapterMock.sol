// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import "../price-feeds/PriceFeedsAdapter.sol";

contract PriceFeedsAdapterMock is PriceFeedsAdapter, AuthorisedMockSignersBase {
  constructor(bytes32[] memory dataFeedsIds) PriceFeedsAdapter(dataFeedsIds) {}

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
