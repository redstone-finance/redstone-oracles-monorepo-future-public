// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {ICappedPriceFeed} from "./ICappedPriceFeed.sol";
import {IPriceFeed} from "../interfaces/IPriceFeed.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title CappedPriceFeed
/// @author RedStone team
/// @notice Described in ICappedPriceFeed
/// @dev It assumes that all prices are described in same ratio, with same decimals
abstract contract CappedPriceFeed is ICappedPriceFeed 
{
    /// Defines precision for parameters passed in percentage
    uint256 constant PERCENTAGE_FACTOR = 1e4;

    uint256 constant MINIMAL_INTERVAL_BETWEEN_SNAPSHOTS = 1 minutes;
    uint256 constant MAX_FALLBACK_PERIOD = 30 days;

    /// 500% is max possible percent value
    uint256 constant UPPER_HARD_LIMIT_PERCENT = 5 * PERCENTAGE_FACTOR;
    uint256 constant LOWER_HARD_LIMIT_PERCENT = 1;

    /// @inheritdoc ICappedPriceFeed
    function getFundamentalRatio() view public virtual returns (uint256);

    /// @inheritdoc ICappedPriceFeed
    function getMarketPriceFeed() view public virtual returns (IPriceFeed);

    /// Optmized to fit in single storage slot
    struct ParamsStorage {
       uint16 maxYearlyRatioGrowthPercent;
       uint16 maxMarketDeviationPercent;
       address paramsSetter;
    }

    /// Optmized to fit in single storage slot (if fundamental ratio is less then 200 bits)
    struct SnapshotStorage {
        bool isValueBiggerThan200Bits;
        uint200 fundamentalRatioSmallerValue;
        uint48 timestamp;
        uint256 fundamentalRatioBiggerValue;
    }

  
    /// ethers.utils.solidityKeccak256(["string"],["RedStone.CappedPriceFeed.ParamsStorage"])
    bytes32 private constant PARAMS_STORAGE_LOCATION = 0xc5cf9af1b5468f91e35aaa8a7815124709f84924a3bced8b979ee79c432284c5;
    /// ethers.utils.solidityKeccak256(["string"],["RedStone.CappedPriceFeed.SnapshotStorage"])
    bytes32 private constant SNAPSHOT_STORAGE_LOCATION = 0x116215827db36200c2bc718454306c172623c83e4d26fe94709962facae54db7;

    function _getParamsStorage() private pure returns (ParamsStorage storage $) {
        assembly {
            $.slot := PARAMS_STORAGE_LOCATION
        }
    }

    function _getSnapshotStorage() private pure returns (SnapshotStorage storage $) {
        assembly {
            $.slot := SNAPSHOT_STORAGE_LOCATION
        }
    }

    /// @inheritdoc ICappedPriceFeed
    function getMaxYearlyGrowthRatePercent() external view returns (uint256) {
        ParamsStorage storage paramsStore = _getParamsStorage();

        if (paramsStore.maxYearlyRatioGrowthPercent == 0) {
            revert MustInitCapParameters();
        }

        return paramsStore.maxYearlyRatioGrowthPercent;
    }

    function getSnapshot() public view returns (uint256, uint48) {
        SnapshotStorage storage snapshotStore = _getSnapshotStorage();

        if (snapshotStore.timestamp == 0) {
            revert MustInitCapParameters();
        }

        if (snapshotStore.isValueBiggerThan200Bits) {
            return (snapshotStore.fundamentalRatioBiggerValue, snapshotStore.timestamp);
        }

        return (snapshotStore.fundamentalRatioSmallerValue, snapshotStore.timestamp);
    }

    /// @inheritdoc ICappedPriceFeed
    function getSnapshotRatio() external view returns (uint256 ratio) {
        (ratio,) = getSnapshot();
    }

    /// @inheritdoc ICappedPriceFeed
    function getSnapshotTimestamp() external view returns (uint256 timestamp) {
        (,timestamp) = getSnapshot();
    }

    /// @inheritdoc ICappedPriceFeed
    function getRatio() public view returns (int256) {
        uint256 fundamentalRatio = getFundamentalRatio();

        if (fundamentalRatio == 0) {
            (uint256 snapshottedRatio, uint256 snapshottedTimestamp) = getSnapshot();
            // to ensure that the fallback mechanism does not lead to outdated or manipulated data being used indefinitely
            if (block.timestamp - snapshottedTimestamp > MAX_FALLBACK_PERIOD) {
                revert MaxFallbackPeriodCrossed();
            }
            fundamentalRatio = snapshottedRatio;
        }

        return SafeCast.toInt256(fundamentalRatio);
    }

    /// @inheritdoc ICappedPriceFeed
    function getMaxRatio() public view returns (int256) {
        (uint256 snapshottedRatio, uint256 snapshottedTimestamp) = getSnapshot();
        ParamsStorage storage paramsStore = _getParamsStorage();

        uint256 maxAllowedGrowthFromLastSnapshot = (snapshottedRatio * paramsStore.maxYearlyRatioGrowthPercent * (block.timestamp - snapshottedTimestamp)) / PERCENTAGE_FACTOR / 365 days;

        uint256 maxRatio = snapshottedRatio + maxAllowedGrowthFromLastSnapshot;

        return SafeCast.toInt256(maxRatio);
    }

    /// @inheritdoc ICappedPriceFeed
    function getMarketRatio() external view returns (int256) {
        return getMarketPriceFeed().latestAnswer();
    }

    /// @inheritdoc ICappedPriceFeed
    function getFundamentalRatioDeviationFromMarketRatio() public view returns (int256) {
        int256 marketRatio = getMarketPriceFeed().latestAnswer();
        int256 fundamentalRatio = getRatio();

        return ((fundamentalRatio - marketRatio) * int256(PERCENTAGE_FACTOR)) / marketRatio;
    }

    /// @inheritdoc ICappedPriceFeed
    function isFundamentalRatioCloseToMarketRatio() public view returns (bool) {
        ParamsStorage storage paramStore = _getParamsStorage();
        uint256 priceDeviation = abs(getFundamentalRatioDeviationFromMarketRatio());

        return priceDeviation <= paramStore.maxMarketDeviationPercent;
    }

    function abs(int256 x) private pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    /// @inheritdoc ICappedPriceFeed
    function isCapped() external view returns (bool) {
       return getRatio() > getMaxRatio();
    }

    /// @inheritdoc ICappedPriceFeed
    function snapshotRatio() external {
        (, uint256 snapshotTimestamp) = getSnapshot();

        if (block.timestamp - snapshotTimestamp < MINIMAL_INTERVAL_BETWEEN_SNAPSHOTS) {
            revert SnapshotCanBeUpdatedOnlyEveryOneMinute();
        }

        uint256 fundamentalRatio = getFundamentalRatio();

        if (fundamentalRatio > uint256(getMaxRatio())) {
            revert FundamentalRatioCantExceedMaxRatio();
        }

       _unsafeSetSnapshotRatio(fundamentalRatio);
    }

    /// @dev abillity to call this function also add extra permission to update snapshot ratio in same block
    /// and to set ratio to arbitrary number without maxRatio comparison
    /// this MUST be called only by permissioned actor
    function _unsafeSetSnapshotRatio(uint256 fundamentalRatio) private {
        if (fundamentalRatio == 0) {
            revert FundamentalRatioEqualsZero();
        }

        SnapshotStorage storage snapshotStore = _getSnapshotStorage();

        snapshotStore.timestamp = uint48(block.timestamp);

        if (fundamentalRatio > type(uint200).max) {
            snapshotStore.isValueBiggerThan200Bits = true;
            snapshotStore.fundamentalRatioBiggerValue = fundamentalRatio;
        } else {
            snapshotStore.isValueBiggerThan200Bits = false;
            snapshotStore.fundamentalRatioSmallerValue = uint200(fundamentalRatio);
        }
    }

    /// @inheritdoc ICappedPriceFeed
    function setCapParameters(uint16 maxYearlyRatioGrowthPercent, uint16 maxMarketDeviationPercent) external {
        ParamsStorage storage paramsStore = _getParamsStorage();
    
        if (paramsStore.paramsSetter == address(0)) {
            paramsStore.paramsSetter = msg.sender;
        } else if (paramsStore.paramsSetter != msg.sender) {
            revert CallerIsNotParamSetter();
        }

        validatePercentBoundries(maxYearlyRatioGrowthPercent);
        paramsStore.maxYearlyRatioGrowthPercent = maxYearlyRatioGrowthPercent;
        validatePercentBoundries(maxMarketDeviationPercent);
        paramsStore.maxMarketDeviationPercent = maxMarketDeviationPercent;

        uint256 fundamentalRatio = getFundamentalRatio();
        _unsafeSetSnapshotRatio(fundamentalRatio);
    }

    /// @inheritdoc ICappedPriceFeed
    function transferParamSetterRole(address tranferTo) external {
        ParamsStorage storage paramsStore = _getParamsStorage();
        if (paramsStore.paramsSetter != msg.sender) {
            revert CallerIsNotParamSetter();
        }

        if (tranferTo == address(0)) {
            revert CanNotTransferRoleToZeroAddress();
        }
        
        paramsStore.paramsSetter = tranferTo;
    }

    function validatePercentBoundries(uint256 valueInPercent) internal view virtual {
        if (valueInPercent >  UPPER_HARD_LIMIT_PERCENT || valueInPercent < LOWER_HARD_LIMIT_PERCENT) {
            revert PercentValueOutOfRange(LOWER_HARD_LIMIT_PERCENT, UPPER_HARD_LIMIT_PERCENT, valueInPercent);
        }
    }

    function latestAnswerIfRatioCloseToMarktetRatio() external view returns (int256) {
        if (!isFundamentalRatioCloseToMarketRatio()) {
            revert FundametnalRatioDivergedFromMarketRatio();
        }
        return latestAnswer();
    }

    /// @notice If fundamental ratio is bigger then computed maxRatio, returns capped ratio to maxRatio
    /// @inheritdoc ICappedPriceFeed
    function latestAnswer() public view returns (int256) {
        int256 ratio = getRatio();
        int256 maxRatio = getMaxRatio();

        if (ratio > maxRatio) {
            return maxRatio;
        }

        return ratio;
    }

    function decimals() external view returns (uint8) {
        return getMarketPriceFeed().decimals();
    }

    function description() external view returns (string memory) {
       return getMarketPriceFeed().description();
    }

    function getDataFeedId() external view returns (bytes32) {
        return getMarketPriceFeed().getDataFeedId();
    }

    function version() external view returns (uint256) {
        return getMarketPriceFeed().version();
    }
}
