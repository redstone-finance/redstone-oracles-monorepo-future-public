// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./AuthorisedMockSignersBase.sol";
import "../price-feeds/PriceFeedsManager.sol";

contract PriceFeedsManagerMock is PriceFeedsManager, AuthorisedMockSignersBase {
  constructor(bytes32[] memory dataFeedsIds) PriceFeedsManager(dataFeedsIds) {}

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 10;
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
