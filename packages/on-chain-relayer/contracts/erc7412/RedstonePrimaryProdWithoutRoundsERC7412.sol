// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

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

    function getTTL() view internal virtual returns (uint256);
   
    function oracleId() pure external returns (bytes32) {
        return ORACLE_ID;
    }

    function getAllowedTimestampDiffsInSeconds() public view override virtual returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
        maxDataAheadSeconds = 120;
        maxDataDelaySeconds = 120;
    }

    function validateDataFeedValueOnRead(bytes32 dataFeedId, uint256 valueForDataFeedId) public view override virtual {
        super.validateDataFeedValueOnRead(dataFeedId, valueForDataFeedId);
        uint256 lastTimestamp = getBlockTimestampFromLatestUpdate();
        if (block.timestamp - lastTimestamp > getTTL()) {
            revert OracleDataRequired(
                address(this),
                abi.encode(getDataFeedId(), getUniqueSignersThreshold(), getDataServiceId())
            );
        }
    }

    function fulfillOracleQuery(bytes calldata signedOffchainData) payable external {
        (uint256 dataTimestamp) = abi.decode(signedOffchainData, (uint256));
        updateDataFeedsValues(dataTimestamp);
    }
}
