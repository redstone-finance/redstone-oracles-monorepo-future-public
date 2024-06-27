// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {MultiFeedAdapterWithoutRounds} from "./MultiFeedAdapterWithoutRounds.sol";
import {PriceFeedWithoutRounds} from "./PriceFeedWithoutRounds.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract PriceFeedWithoutRoundsForMultiFeedAdapter is PriceFeedWithoutRounds {
  function latestRoundData()
    public
    view
    override
    virtual
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    roundId = latestRound();

    MultiFeedAdapterWithoutRounds multiAdapter = MultiFeedAdapterWithoutRounds(address(getPriceFeedAdapter()));

    (/* uint256 lastDataTimestamp */, uint256 lastBlockTimestamp, uint256 lastValue) = multiAdapter.getLastUpdateDetails(getDataFeedId());

    answer = SafeCast.toInt256(lastValue);

    // These values are equal after chainlink’s OCR update
    startedAt = lastBlockTimestamp;
    updatedAt = lastBlockTimestamp;

    // We want to be compatible with Chainlink's interface
    // And in our case the roundId is always equal to answeredInRound
    answeredInRound = roundId;
  }
}
