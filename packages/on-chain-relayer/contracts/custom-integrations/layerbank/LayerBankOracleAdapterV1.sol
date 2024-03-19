// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {LayerBankOracleAdapterBase} from "./LayerBankOracleAdapterBase.sol";

contract LayerBankOracleAdapterV1 is LayerBankOracleAdapterBase {

  uint256 internal constant MAX_ALLOWED_DATA_STALENESS = 10 hours;
  uint256 internal constant DEFAULT_DECIMAL_SCALER = 1e10;

  bytes32 internal constant ETH_ID = bytes32("ETH");
  address internal constant ETH_ASSET = address(0);

  bytes32 internal constant USDC_ID = bytes32("USDC");
  address internal constant USDC_ASSET = 0xb73603C5d87fA094B7314C74ACE2e64D165016fb;

  bytes32 internal constant TIA_ID = bytes32("TIA");
  address internal constant TIA_ASSET = 0x6Fae4D9935E2fcb11fC79a64e917fb2BF14DaFaa;

  bytes32 internal constant LAB_M_ID = bytes32("LAB.m");
  address internal constant LAB_M_ASSET = 0x20A512dbdC0D006f46E6cA11329034Eb3d18c997;

  bytes32 internal constant WST_ETH_ID = bytes32("wstETH");
  address internal constant WST_ETH_ASSET = 0x2FE3AD97a60EB7c79A976FC18Bb5fFD07Dd94BA5;

  bytes32 internal constant STONE_ID = bytes32("STONE");
  address internal constant STONE_ASSET = 0xEc901DA9c68E90798BbBb74c11406A32A70652C3;

  bytes32 internal constant W_USDM_ID = bytes32("wUSDM");
  address internal constant W_USDM_ASSET = 0xbdAd407F77f44F7Da6684B416b1951ECa461FB07;

  bytes32 internal constant MANTA_ID = bytes32("MANTA");
  address internal constant MANTA_ASSET = 0x95CeF13441Be50d20cA4558CC0a27B601aC544E5;

  function getDataFeedIdForAsset(address asset) public view virtual override returns(bytes32) {
    if (asset == USDC_ASSET) {
      return USDC_ID;
    } else if (asset == TIA_ASSET) {
      return TIA_ID;
    } else if (asset == LAB_M_ASSET) {
      return LAB_M_ID;
    } else if (asset == WST_ETH_ASSET) {
      return WST_ETH_ID;
    } else if (asset == STONE_ASSET) {
      return STONE_ID;
    } else if (asset == W_USDM_ASSET) {
      return W_USDM_ID;
    } else if (asset == MANTA_ASSET) {
      return MANTA_ID;
    } else if (asset == ETH_ASSET) {
      return ETH_ID;
    } else {
      revert UnsupportedAsset(asset);
    }
  }

  function getDataFeedIds() public view virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](8);
    dataFeedIds[0] = ETH_ID;
    dataFeedIds[1] = USDC_ID;
    dataFeedIds[2] = TIA_ID;
    dataFeedIds[3] = LAB_M_ID;
    dataFeedIds[4] = WST_ETH_ID;
    dataFeedIds[5] = STONE_ID;
    dataFeedIds[6] = W_USDM_ID;
    dataFeedIds[7] = MANTA_ID;
  }

  function convertDecimals(bytes32 dataFeedId, uint256 valueFromRedstonePayload) public view virtual override returns(uint256) {
    dataFeedId; // Currently, this arg is unused, but it be required for new tokens
    return valueFromRedstonePayload * DEFAULT_DECIMAL_SCALER;
  }

  function priceOfETH() public view returns (uint256) {
    return priceOf(ETH_ASSET);
  }

  function requireNonStaleData() public view virtual override {
    uint256 latestUpdateTime = getBlockTimestampFromLatestUpdate();
    uint256 curTime = getBlockTimestamp();
    if (latestUpdateTime < curTime && (curTime - latestUpdateTime) > MAX_ALLOWED_DATA_STALENESS) {
      revert DataIsStale(latestUpdateTime);
    }
  }
}
