// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {IERC7412} from './IERC7412.sol';
import {MergedSinglePriceFeedAdapterWithoutRoundsPrimaryProd} from '../price-feeds/data-services/MergedSinglePriceFeedAdapterWithoutRoundsPrimaryProd.sol';

 /**
 * @title Implementation of a price feeds adapter and price feed and ERC7412
 * @author The Redstone Oracles team
 * @dev This contract is abstract, the following functions should be
 * implemented in the actual contract before deployment:
 * - getDataFeedId
 * - getTTL
 */
 abstract contract RedstonePrimaryProdWithoutRoundsERC7412 is IERC7412, MergedSinglePriceFeedAdapterWithoutRoundsPrimaryProd {
    bytes32 constant ORACLE_ID = bytes32("REDSTONE");
    uint256 constant MAX_DATA_AHEAD_SECONDS = 120;
    uint256 constant MAX_DATA_DELAY_SECONDS = 120;

    function getTTL() view internal virtual returns (uint256);

    function oracleId() pure external returns (bytes32) {
        return ORACLE_ID;
    }

    function getAllowedTimestampDiffsInSeconds() public view override virtual returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
        return (MAX_DATA_AHEAD_SECONDS, MAX_DATA_DELAY_SECONDS);
    }

    /**
     * @dev If price was updated recently we return success.
     * This allow smooth UX when two users independently tries to update price in same block 
     */
    function updateDataFeedsValues(uint256 dataPackagesTimestamp) override public virtual {
        uint256 lastTimestamp = getBlockTimestampFromLatestUpdate();
        if(block.timestamp - lastTimestamp <  MIN_INTERVAL_BETWEEN_UPDATES) {
            return;
        }

        super.updateDataFeedsValues(dataPackagesTimestamp);
    }

    function validateDataFeedValueOnRead(bytes32 dataFeedId, uint256 value) public view override virtual {
        uint256 lastTimestamp = getBlockTimestampFromLatestUpdate();
        if (block.timestamp - lastTimestamp > getTTL()) {
            revert OracleDataRequired(
                address(this),
                abi.encode(getDataFeedId(), getUniqueSignersThreshold(), getDataServiceId())
            );
        }

        super.validateDataFeedValueOnRead(dataFeedId, value); 
    }

    function fulfillOracleQuery(bytes calldata signedOffchainData) payable external {
        (uint256 dataTimestamp) = abi.decode(signedOffchainData, (uint256));
        updateDataFeedsValues(dataTimestamp);
    }
}
