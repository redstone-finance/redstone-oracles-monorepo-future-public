// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {MergedPriceFeedAdapterWithoutRoundsPrimaryProd} from "../../price-feeds/data-services/MergedPriceFeedAdapterWithoutRoundsPrimaryProd.sol";
import {DeviationLib} from "../../libs/DeviationLib.sol";

contract MergedAdapterWithoutRoundsSusdeRateProviderBase is
  MergedPriceFeedAdapterWithoutRoundsPrimaryProd
{
  uint256 private constant MIN_UPDATE_INTERVAL = 12 hours;
  uint256 private constant PRECISION = 10000;
  uint256 private constant MAX_ALLOWED_DEVIATION_PERCENT = 2 * PRECISION;

  error UpdaterNotAuthorised(address signer);
  error ProposedValueIsDeviatedTooMuch(
    uint256 latestValue,
    uint256 proposedNewValue,
    uint256 deviation,
    uint256 maxAllowedDeviationPercent
  );

  function decimals() public pure override returns (uint8) {
    return 18;
  }

  function getDataFeedId() public pure virtual override returns (bytes32) {
    return bytes32("sUSDe_RATE_PROVIDER");
  }

  function getRate() public view virtual returns (uint256) {
    return SafeCast.toUint256(latestAnswer());
  }

  function description() public view virtual override returns (string memory) {
    return "RedStone Ethena Balancer Rate Provider sUSDe Price Feed";
  }

  function validateDataFeedValueOnWrite(bytes32 dataFeedId, uint256 valueForDataFeed) public view virtual override {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
    _validateDeviationFromLatestAnswer(valueForDataFeed, dataFeedId);
  }

  function getMinIntervalBetweenUpdates()
    public
    view
    virtual
    override
    returns (uint256)
  {
    return MIN_UPDATE_INTERVAL;
  }

  function _validateDeviationFromLatestAnswer(
    uint256 proposedValue,
    bytes32 dataFeedId
  ) internal view virtual {
    uint256 latestAnswer = getValueForDataFeedUnsafe(dataFeedId);
    if (latestAnswer != 0) {
      uint256 deviation = DeviationLib.calculateAbsDeviation(
        proposedValue,
        latestAnswer,
        PRECISION
      );
      if (deviation > MAX_ALLOWED_DEVIATION_PERCENT) {
        revert ProposedValueIsDeviatedTooMuch(
          latestAnswer,
          proposedValue,
          deviation,
          MAX_ALLOWED_DEVIATION_PERCENT
        );
      }
    }
  }
}
