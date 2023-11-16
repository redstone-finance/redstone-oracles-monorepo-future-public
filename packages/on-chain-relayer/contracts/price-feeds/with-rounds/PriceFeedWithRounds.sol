// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterWithRounds} from "./PriceFeedsAdapterWithRounds.sol";
import {PriceFeedBase} from "../PriceFeedBase.sol";

/**
 * @title Implementation of a price feed contract with rounds support
 * @author The Redstone Oracles team
 * @dev This contract is abstract. The actual contract instance
 * must implement the following functions:
 * - getDataFeedId
 * - getPriceFeedAdapter
 */
abstract contract PriceFeedWithRounds is PriceFeedBase {
  uint256 internal constant UINT80_MAX = uint256(type(uint80).max);

  error UnsafeUint256ToUint80Conversion(uint256 value);

  function getPriceFeedAdapterWithRounds() public view returns(PriceFeedsAdapterWithRounds) {
    return PriceFeedsAdapterWithRounds(address(getPriceFeedAdapter()));
  }

  /**
   * @notice Old Chainlink function for getting the number of latest round
   * @return latestRound The number of the latest successful round
   */
  function latestRound() public view override returns (uint80) {
    uint256 latestRoundUint256 = getPriceFeedAdapterWithRounds().getLatestRoundId();

    if (latestRoundUint256 > UINT80_MAX) {
      revert UnsafeUint256ToUint80Conversion(latestRoundUint256);
    }

    return uint80(latestRoundUint256);
  }

  /**
   * @notice Returns details for the given round
   * @param roundId Requested round identifier
   */
  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    (uint256 dataFeedValue, uint128 roundDataTimestamp, uint128 roundBlockTimestamp) = getPriceFeedAdapterWithRounds().getRoundDataFromAdapter(
      getDataFeedId(),
      requestedRoundId
    );
    roundId = requestedRoundId;

    if (dataFeedValue > INT256_MAX) {
      revert UnsafeUintToIntConversion(dataFeedValue);
    }

    answer = int256(dataFeedValue);
    startedAt = roundDataTimestamp / 1000; // convert to seconds
    updatedAt = roundBlockTimestamp;

    // We want to be compatible with Chainlink's interface
    // And in our case the roundId is always equal to answeredInRound
    answeredInRound = requestedRoundId;
  }
}
