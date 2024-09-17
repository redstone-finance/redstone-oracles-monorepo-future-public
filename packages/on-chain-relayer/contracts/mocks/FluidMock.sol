//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {FluidRedstoneAdapterReader} from "../custom-integrations/fluid/FluidRedstoneAdapterReader.sol";
import {IFluidOracle} from "../custom-integrations/fluid/IFluidOracle.sol";

contract FluidMock is FluidRedstoneAdapterReader {

    address immutable oracleAddress;
    IFluidOracle immutable oracle;

    constructor(IFluidOracle _oracle)  {
        oracleAddress = address(_oracle);
        oracle = _oracle;
    }

    function optimizedGetExchangesRate() external {
        getRedstoneExchangeRate(oracleAddress);
    }

    function normalGetExchangesRate() external view {
        oracle.getExchangeRate();
   }

}


