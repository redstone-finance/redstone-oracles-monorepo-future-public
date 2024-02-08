// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {ILToken} from "./ILToken.sol";
import {IPriceCalculator} from "./IPriceCalculator.sol";
import {PriceFeedsAdapterWithRoundsPrimaryProd} from "../../price-feeds/data-services/PriceFeedsAdapterWithRoundsPrimaryProd.sol";

abstract contract LayerBankOracleAdapterBase is PriceFeedsAdapterWithRoundsPrimaryProd, IPriceCalculator {
  error UnsupportedAsset(address asset);
  error DataIsStale(uint256 lastUpdateTime);

  function getDataFeedIdForAsset(address asset) public view virtual returns(bytes32);
  function convertDecimals(bytes32 dataFeedId, uint256 valueFromRedstonePayload) public view virtual returns (uint256);
  function requireNonStaleData() public view virtual;

  function getUnderlyingAsset(address gToken) public view virtual returns(address) {
    return ILToken(gToken).underlying();
  }

  function _uncheckedPriceOf(address asset) internal view virtual returns (uint256) {
    bytes32 dataFeedId = getDataFeedIdForAsset(asset);
    uint256 valueFromRedstonePayload = getValueForDataFeed(dataFeedId);
    return convertDecimals(dataFeedId, valueFromRedstonePayload);
  }

  function priceOf(address asset) public view virtual returns (uint256) {
    requireNonStaleData();
    return _uncheckedPriceOf(asset);
  }

  function pricesOf(
    address[] memory assets
  ) external view returns (uint256[] memory values) {
    requireNonStaleData();
    values = new uint256[](assets.length);
    for (uint256 i = 0; i < assets.length; i++) {
      values[i] = _uncheckedPriceOf(assets[i]);
    }
  }

  function getUnderlyingPrice(address gToken) public view returns (uint256) {
    return priceOf(getUnderlyingAsset(gToken));
  }

  function getUnderlyingPrices(
    address[] memory gTokens
  ) public view returns (uint256[] memory values) {
    values = new uint256[](gTokens.length);
    for (uint256 i = 0; i < gTokens.length; i++) {
      values[i] = getUnderlyingPrice(gTokens[i]);
    }
  }
}
