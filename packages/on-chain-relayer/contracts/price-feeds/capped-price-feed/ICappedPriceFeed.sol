// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {IPriceFeed} from "../interfaces/IPriceFeed.sol";

/**
 * @title ICappedPriceFeed
 * @notice ICappedPriceFeed is an advanced price feed contract that offers enhanced safety and stability over standard market price feeds and fundamental ratio fetched directly from protocol by combining best traits of two approaches.
 * This contract ensures that prices do not deviate excessively from predefined growth rates and allow to benchmark fundametnal price against market prices, providing a more reliable and secure pricing mechanism for various protocols.
 * [IMPORTANT] Round methods are not supported by CappedPriceFeed. To access historical data use getMarketPirceFeed() contract.
 *
 * ## Key Features
 *
 * - **Price Capping:** The contract limits the maximum growth of the ratio to a predefined yearly percentage, preventing sudden and extreme price changes that could destabilize defi protocols
 * - **Snapshot Mechanism:** The contract can take and store snapshots of the fundamental ratio at specified intervals, ensuring a fallback mechanism in case the fundamental price feed fails
 * - **Market Benchmark:** It allows to benchamark the deviation between the market price and the fundamental price, ensuring that the reported prices stay within acceptable limits
 * - **Permissioned Parameters Updates:** Only authorized addresses can update critical parameters enhancing security against unauthorized changes
 * - **Permissionless Snapshots:** Anyone can snapshot fundamental price to ensure fresh and fair max cap calculation
 *
 * ## Crucial functions
 * - **setCapParameters:** This function allows authorized addresses to set the maximum yearly growth rate and the maximum allowed deviation from the market price. It provides flexibility to adjust parameters as needed while maintaining security.
 *
 * - **snapshotRatio:** This function allows taking a snapshot of the current fundamental ratio. Snapshots can only be taken at specified intervals to prevent manipulation. This mechanism provides a fallback price in case the primary feed fails.
 *
 * - **getFundamentalRatioDeviationFromMarketRatio:** This function returns the deviation between the market price and the fundamental ratio. It helps in understanding how much the current market price differs from the expected fundamental value.
 *
 * - **isFundamentalRatioCloseToMarketRatio:** This function checks if the current fundamental ratio is close to the market price, within a predefined deviation threshold. It ensures that the prices reported by the contract are consistent with market conditions.
 *
 * - **latestAnswerIfRatioCloseToMarktetRatio** Same as latestAnswer, but additionally revert if fundamental ratio is NOT close to the market price. 
 *
 * - **getMaxRatio:** This function calculates the maximum allowed ratio based on the last snapshot and the maximum yearly growth rate. It ensures that the ratio does not exceed a reasonable limit over time.
 *
 * - **isCapped:** This function checks if the current fundamental ratio exceeds the calculated maximum ratio, indicating that the price is being capped. It ensures that extreme price increases are controlled.
 *
 * - **latestAnswer:** This function returns the current ratio, capped at the maximum allowable ratio if necessary. It ensures that the price reported by the contract remains within acceptable bounds.
 *
 */
interface ICappedPriceFeed {
    error CallerIsNotParamSetter();
    error MustInitCapParameters();
    error PercentValueOutOfRange(uint256 lower, uint256 upper, uint256 given);
    error FundamentalRatioEqualsZero();
    error SnapshotCanBeUpdatedOnlyEveryOneMinute();
    error RatioOverflowsInt256();
    error FundamentalRatioCantExceedMaxRatio();
    error MaxFallbackPeriodCrossed();
    error FundametnalRatioDivergedFromMarketRatio();
    error CanNotTransferRoleToZeroAddress();
    error DoesNotSupportHistoricalData();

    /// @notice Allows to snapshot current fundamental ratio returned by contract
    /// @dev Reverts updates more frequent then MINIMAL_INTERVAL_BETWEEN_SNAPSHOTS, to prevent from manipulation of maxRatio
    /// Reverts updates which crosses computed maxRatio
    function snapshotRatio() external;
    
    /// @notice Ussed to transfer ParamSetter role. ParamSetter role is established on  first call to setCapParameters function.
    function transferParamSetterRole(address tranferTo) external;

    /// @notice Used to get max value base on annual growth and time passed since last snapshot
    /// @dev If snapshotStore.fundamentalRatio is less than (block.timestamp - snapshotStore.timestamp) * (PERCENTAGE_FACTOR * 365 days), then growthSinceLastSnapshot is equal to 0, because of loss of precision.
    function getMaxRatio() external view returns (int256);

    /// @notice This method MUST be implemented per feed. It MUST return fundamental ratio, reported by protocol contract in same decimals as marketPriceFeed.
    /// @dev It SHOULD return 0 in case of failure to allow fallback mechanism use snapshoted price instead. It has to be done in implementation contract, because try/catch can only be used with external methods.
    /// @return Ratio between two assets
    function getFundamentalRatio() external view returns (uint256);

    /// @notice This method, MUST return IPricFeed contract, which serves market price of this contract ratio 
    function getMarketPriceFeed() external view returns (IPriceFeed);

    /// @return market ratio
    function getMarketRatio() external view returns (int256);

    /// @notice Returns deviation between market and fundamental ratio
    /// @dev Return value is scaled by PERCENTAGE_FACTOR=1e4 => 10000 = 100%, could be negative
    function getFundamentalRatioDeviationFromMarketRatio() external view returns (int256);

    /// @notice returns true if the fundamental ratio is NOT devidated more then threshold defined in params from market ratio
    function isFundamentalRatioCloseToMarketRatio() external view returns (bool);

    /// @notice Same as latestAnswer. But reverts if fundamentalRatio is not close to market ratio. "close" is defined by maxMarketDeviationPercent parameter.
    function latestAnswerIfRatioCloseToMarktetRatio() external view returns (int256);

    /// @notice Permissioned method used to set max yearly growth
    /// @dev This function MUST be called by the owner immediately after deployment. On first call it sets msg.sender as paramSetter role. Must of calls reverts before setting this function.
    /// @param maxYearlyRatioGrowthPercent scaled by PERCENTAGE_FACTOR - for PERCENTAGE_FACTOR=1e4 => 10000 = 100% 1 = 0.01% (min value)
    function setCapParameters(uint16 maxYearlyRatioGrowthPercent, uint16 maxMarketDeviationPercent) external;

    // Functions compatible with with https://github.com/bgd-labs/aave-capo/blob/c5436580f78e27906df1d1e0756dbcd87e9d8a48/src/interfaces/IPriceCapAdapter.sol
    // we are omiting here structs, events, errors, CONSTANTS, function getMaxRatioGrowthPerSecond() external view returns (uint256)
    
    /// @notice Returns fundamental ratio if call fails, fallbacks to last snapshot
    /// @dev To mitigate the issues with availability of contract with fundamental price
    /// if current fundamental price returns 0 we fallback to last snapshot price
    function getRatio() external view returns (int256);

    /// @notice Returns last snapshoted fundamental ratio
    function getSnapshotRatio() external view returns (uint256);

    /// @notice Returns last snapshot timestamp
    function getSnapshotTimestamp() external view returns (uint256);

    /// @notice Returns max yearly ratio growth percent, scaled by PERCENTAGE_FACTOR=1e4 => 10000 = 100%
    function getMaxYearlyGrowthRatePercent() external view returns (uint256);

    /// @notice Returns true if current fundamental ratio would be capped by computed maxRatio
    function isCapped() external view returns (bool);

    function latestAnswer() external view returns (int256);

    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function getDataFeedId() external view returns (bytes32);

    function version() external view returns (uint256);
} 