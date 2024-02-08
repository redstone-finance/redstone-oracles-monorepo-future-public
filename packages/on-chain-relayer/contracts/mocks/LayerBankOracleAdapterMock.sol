// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {LayerBankOracleAdapterBase} from "../custom-integrations/layerbank/LayerBankOracleAdapterBase.sol";

contract LayerBankOracleAdapterMock is LayerBankOracleAdapterBase, AuthorisedMockSignersBase {
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }

  function getDataFeedIdForAsset(address asset) public view virtual override returns(bytes32) {
    if (asset == 0x0000000000000000000000000000000000000001) {
      return bytes32("BTC");
    } else {
      revert UnsupportedAsset(asset);
    }
  }

  function getDataFeedIds() public view virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = bytes32("BTC");
  }

  function requireNonStaleData() public view virtual override {
    // No staleness check in this mock contract
  }

  function convertDecimals(bytes32 dataFeedId, uint256 valueFromRedstonePayload) public view virtual override returns(uint256) {
    dataFeedId;
    return valueFromRedstonePayload * 1e10;
  }

  function priceOfETH() public view returns (uint256) {
    return priceOf(0x0000000000000000000000000000000000000000);
  }
}
