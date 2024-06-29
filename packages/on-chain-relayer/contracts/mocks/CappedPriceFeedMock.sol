
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {CappedPriceFeed} from "../price-feeds/capped-price-feed/CappedPriceFeed.sol";
import {IPriceFeed} from "../price-feeds/interfaces/IPriceFeed.sol";

contract MockCappedPriceFeed is CappedPriceFeed {
    uint256 _fundamentalRatio = 1 ether;
    IPriceFeed _marketPriceFeed = IPriceFeed(new MockMarketPriceFeed());

    function getFundamentalRatio() view public virtual override returns (uint256) {
        return _fundamentalRatio;
    }

    function getMarketPriceFeed() view public virtual override returns (IPriceFeed) {
        return _marketPriceFeed;
    }

    // helpers
    function setFundementalRatio(uint256 fundamentalRatio) external {
        _fundamentalRatio = fundamentalRatio;
    }

    function setMarketPriceFeed(IPriceFeed marketPriceFeed) external {
        _marketPriceFeed = marketPriceFeed;
    }
}



contract MockMarketPriceFeed is IPriceFeed {
    int256 private answer = 1e18;
    uint80 private roundId = 1;
    uint8 private _decimals = 8;
    string private _description = "";
    uint256 private _version = 1;
    bytes32 private dataFeedId = "BTC/ETH";

    function setAnswer(int256 _answer) external {
        answer = _answer;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function version() external view override returns (uint256) {
        return _version;
    }

    function getDataFeedId() external view override returns (bytes32) {
        return dataFeedId;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 id,
            int256 _answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        // This is a mock, so we can simplify the logic for round data
        return (_roundId, answer, block.timestamp, block.timestamp, _roundId);
    }

    function latestAnswer() external view override returns (int256) {
        return answer;
    }

    function latestRound() external view override returns (uint80) {
        return roundId;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 id,
            int256 _answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (roundId, answer, block.timestamp, block.timestamp, roundId);
    }
}