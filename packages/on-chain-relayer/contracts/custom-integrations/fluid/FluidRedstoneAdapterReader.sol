// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {IFluidOracle} from "./IFluidOracle.sol";

/**
 * This contract ilustrates the cheapest possible way to read from FluidOracleRedstoneAdapter contract
 * Gas reduced in comparison to FluidOracleRedstoneAdapter(address).readExchangeRate - less ~2230 gas (total cost = ~5321 (with call included))
 */
contract FluidRedstoneAdapterReader { 
    bytes4 constant READ_EXCHANGE_RATE_SELECTOR = 0xe6aa216c;
  
    function getRedstoneExchangeRate(address oracleAddress) public virtual returns(uint256 exchangeRate) {
        assembly {	
            let freeSlot := mload(0x40)	
            
            mstore(freeSlot, READ_EXCHANGE_RATE_SELECTOR)

            let success := staticcall(
                5000, // estimated gas cost for this function	
                oracleAddress,
                freeSlot,	
                0x04,
                freeSlot,	
                0x20	
            )

            switch success	    
            case 0 {	   
              revert(freeSlot, 0x40) 
            }
            default {
                exchangeRate := mload(freeSlot)
            }
           
        }
    }
}
