// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {CappedPriceFeed} from "./CappedPriceFeed.sol";
import {IPriceFeed} from "../interfaces/IPriceFeed.sol";

interface IConvertToAssets {
    function convertToAssets(uint256 shares) external view returns (uint256);
}

contract PufferCappedPriceFeed is CappedPriceFeed {
    IConvertToAssets constant PUFFER_CONTRACT = IConvertToAssets(0xD9A442856C234a39a81a089C06451EBAa4306a72);
    IPriceFeed constant MARKET_PRICE_FEED = IPriceFeed(0x4aaf2844c5420BF979d5bC2Cf883EF02Db07e590);
    uint256 constant ONE_ETH = 1 ether;

    function getFundamentalRatio() view public virtual override returns (uint256) {
        try PUFFER_CONTRACT.convertToAssets(ONE_ETH) returns (uint256 rate) {
            // ratio is 18 decimals where market feed is 8 decimals, diff is 10
            return rate / 1e10;
        } catch {
            return 0;
        }
    }

    function getMarketPriceFeed() view public virtual override returns (IPriceFeed) {
        return MARKET_PRICE_FEED;
    }
}