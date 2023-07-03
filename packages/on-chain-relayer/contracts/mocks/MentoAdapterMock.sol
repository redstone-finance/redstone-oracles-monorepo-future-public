// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {MentoAdapterBase} from "../custom-integrations/mento/MentoAdapterBase.sol";
import {ISortedOracles} from "../custom-integrations/mento/ISortedOracles.sol";

contract MentoAdapterMock is MentoAdapterBase, AuthorisedMockSignersBase {
  constructor(ISortedOracles sortedOracles_) MentoAdapterBase(sortedOracles_) {}

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }
}
