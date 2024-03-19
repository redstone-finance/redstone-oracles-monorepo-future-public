// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {ILToken} from "./ILToken.sol";
import {IPriceCalculator} from "./IPriceCalculator.sol";
import {PriceFeedsAdapterWithRoundsPrimaryProd} from "../../price-feeds/data-services/PriceFeedsAdapterWithRoundsPrimaryProd.sol";

abstract contract LayerBankOracleAdapterBase is PriceFeedsAdapterWithRoundsPrimaryProd, IPriceCalculator {
  error UnsupportedAsset(address asset);
  error DataIsStale(uint256 lastUpdateTime);

  /**
   * @dev Maps gToken address to dataFeedId
   * @param asset asset address
   * @return dataFeedId
   */
  function getDataFeedIdForAsset(address asset) public view virtual returns(bytes32);

  /**
   * @dev by default redstone value feeds returns values fromatted as 8 decimals
   * This function can be used to override this default per dataFeedId.
   * @param dataFeedId data feed id
   * @param valueFromRedstonePayload value for data feed id by default 8 decimals
   * @return uint256 scaled value from redstone payload 
   */
  function convertDecimals(bytes32 dataFeedId, uint256 valueFromRedstonePayload) public view virtual returns (uint256);

  /**
   * @dev asserts that value is not stale
   */
  function requireNonStaleData() public view virtual;

  /**
   * @param gToken gToken address
   * @return address underlying asset address
   */
  function getUnderlyingAsset(address gToken) public view virtual returns(address) {
    return ILToken(gToken).underlying();
  }

  /**
   * @dev [IMPORTANT] This function does not assert that value is not stale!
   * @param asset address of asset
   * @return uint256 value decimals are scaled according to convertDecimals function
   */
  function _uncheckedPriceOf(address asset) internal view virtual returns (uint256) {
    bytes32 dataFeedId = getDataFeedIdForAsset(asset);
    uint256 valueFromRedstonePayload = getValueForDataFeed(dataFeedId);
    return convertDecimals(dataFeedId, valueFromRedstonePayload);
  }

  /**
   * @dev return value of single asset
   * @param asset asset address
   * @return uint256 value decimals are scaled according to convertDecimals function
   */
  function priceOf(address asset) public view virtual returns (uint256) {
    requireNonStaleData();
    return _uncheckedPriceOf(asset);
  }

  /**
   * @dev return values for many assets
   * @param assets list of assets addresses
   * @return values values are scaled according to convertDecimals function
   */
  function pricesOf(
    address[] memory assets
  ) external view returns (uint256[] memory values) {
    requireNonStaleData();
    values = new uint256[](assets.length);
    for (uint256 i = 0; i < assets.length; i++) {
      values[i] = _uncheckedPriceOf(assets[i]);
    }
  }

  /**
   * @dev return value of gToken underyling asset
   * @param gToken address of gToken contract
   * @return uint256 value is scaled according to convertDecimals function
   */
  function getUnderlyingPrice(address gToken) public view returns (uint256) {
    return priceOf(getUnderlyingAsset(gToken));
  }

  /**
   * @dev return values of gTokens underyling assets
   * @param gTokens addresses of gToken contracts
   * @return values values are scaled according to convertDecimals function
   */
  function getUnderlyingPrices(
    address[] memory gTokens
  ) public view returns (uint256[] memory values) {
    values = new uint256[](gTokens.length);
    for (uint256 i = 0; i < gTokens.length; i++) {
      values[i] = getUnderlyingPrice(gTokens[i]);
    }
  }
}
