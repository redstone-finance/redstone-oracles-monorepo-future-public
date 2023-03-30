// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import "../custom-integrations/mento/MentoAdapter.sol";

contract MentoAdapterMock is MentoAdapter, AuthorisedMockSignersBase {
  constructor(ISortedOracles sortedOracles_) MentoAdapter(sortedOracles_) {}

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }
}
