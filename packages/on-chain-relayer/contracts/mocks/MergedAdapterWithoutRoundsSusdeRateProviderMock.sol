// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {MergedAdapterWithoutRoundsSusdeRateProviderBase} from "../custom-integrations/ethena-balancer-ratio-provider/MergedAdapterWithoutRoundsSusdeRateProviderBase.sol";

contract MergedAdapterWithoutRoundsSusdeRateProviderMock is MergedAdapterWithoutRoundsSusdeRateProviderBase, AuthorisedMockSignersBase {
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }
}
