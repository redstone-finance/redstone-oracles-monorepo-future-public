// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {LayerBankOracleAdapterV1} from "../custom-integrations/layerbank/LayerBankOracleAdapterV1.sol";

contract LayerBankOracleAdapterV1Mock is LayerBankOracleAdapterV1, AuthorisedMockSignersBase {
  error InvalidGToken(address gToken);

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }

  // Real implementation relies on the `.underlying()` method on gToken contract
  function getUnderlyingAsset(address gToken) public view virtual override returns(address) {
    if (gToken == 0x0000000000000000000000000000000000000001) {
      return ETH_ASSET;
    } else if (gToken == 0x0000000000000000000000000000000000000002) {
      return 0x95CeF13441Be50d20cA4558CC0a27B601aC544E5;
    } else {
      revert InvalidGToken(gToken);
    }
  }
}
