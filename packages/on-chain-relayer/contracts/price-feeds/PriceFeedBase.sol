// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";
import {IPriceFeed} from "./interfaces/IPriceFeed.sol";

/**
 * @title Main logic of the price feed contract
 * @author The Redstone Oracles team
 * @dev Implementation of common functions for the PriceFeed contract
 * that queries data from the specified PriceFeedAdapter
 * 
 * It can be used by projects that have already implemented with Chainlink-like
 * price feeds and would like to minimise changes in their existing codebase.
 * 
 * If you are flexible, it's much better (and cheaper in terms of gas) to query
 * the PriceFeedAdapter contract directly
 */
abstract contract PriceFeedBase is IPriceFeed, Initializable {
  uint256 internal constant INT256_MAX = uint256(type(int256).max);

  error UnsafeUintToIntConversion(uint256 value);

  /**
   * @dev Helpful function for upgradable contracts
   */
  function initialize() public virtual initializer {
    // We don't have storage variables, but we keep this function
    // Because it is used for contract setup in upgradable contracts
  }

  /**
   * @notice Returns data feed identifier for the PriceFeed contract
   * @return dataFeedId The identifier of the data feed
   */
  function getDataFeedId() public view virtual returns (bytes32);

  /**
   * @notice Returns the address of the price feed adapter
   * @return address The address of the price feed adapter
   */
  function getPriceFeedAdapter() public view virtual returns (IRedstoneAdapter);


  /**
   * @notice Returns the number of decimals for the price feed
   * @dev By default, RedStone uses 8 decimals for data feeds
   * @return decimals The number of decimals in the price feed values
   */
  function decimals() public virtual pure override returns (uint8) {
    return 8;
  }


  /**
   * @notice Description of the Price Feed
   * @return description
   */
  function description() public view virtual override returns (string memory) {
    return "Redstone Price Feed";
  }

  /**
   * @notice Version of the Price Feed
   * @dev Currently it has no specific motivation and was added
   * only to be compatible with the Chainlink interface
   * @return version
   */
  function version() public virtual pure override returns (uint256) {
    return 1;
  }


  /**
   * @notice Returns details of the latest successful update round
   * @dev It uses few helpful functions to abstract logic of getting
   * latest round id and value
   * @return roundId The number of the latest round
   * @return answer The latest reported value
   * @return startedAt Block timestamp when the latest successful round started
   * @return updatedAt Block timestamp of the latest successful round
   * @return answeredInRound The number of the latest round
   */
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
    answer = latestAnswer();

    uint256 blockTimestamp = getPriceFeedAdapter().getBlockTimestampFromLatestUpdate();

    // These values are equal after chainlink’s OCR update
    startedAt = blockTimestamp;
    updatedAt = blockTimestamp;

    // We want to be compatible with Chainlink's interface
    // And in our case the roundId is always equal to answeredInRound
    answeredInRound = roundId;
  }

  /**
   * @notice Old Chainlink function for getting the latest successfully reported value
   * @return latestAnswer The latest successfully reported value
   */
  function latestAnswer() public virtual view returns (int256) {
    bytes32 dataFeedId = getDataFeedId();

    uint256 uintAnswer = getPriceFeedAdapter().getValueForDataFeed(dataFeedId);

    if (uintAnswer > INT256_MAX) {
      revert UnsafeUintToIntConversion(uintAnswer);
    }

    return int256(uintAnswer);
  }

  /**
   * @notice Old Chainlink function for getting the number of latest round
   * @return latestRound The number of the latest update round
   */
  function latestRound() public view virtual returns (uint80);
}
