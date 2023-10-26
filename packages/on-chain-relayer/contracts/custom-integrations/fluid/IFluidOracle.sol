//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IFluidOracle {
    /// @notice Get the exchange rate between the underlying asset and the peg asset
    /// @return exchangeRate_ The exchange rate, scaled by 1e18
    function getExchangeRate() external view returns (uint256 exchangeRate_);
}

/// @title   FluidOracle
/// @notice  Base contract that any Oracle must implement
abstract contract FluidOracle is IFluidOracle {
    /// @inheritdoc IFluidOracle
    function getExchangeRate() external view virtual returns (uint256 exchangeRate_);
}
