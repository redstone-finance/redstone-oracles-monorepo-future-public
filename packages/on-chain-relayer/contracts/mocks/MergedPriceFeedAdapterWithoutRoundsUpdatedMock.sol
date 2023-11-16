// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {MergedPriceFeedAdapterWithoutRoundsMock} from "./MergedPriceFeedAdapterWithoutRoundsMock.sol";

contract MergedPriceFeedAdapterWithoutRoundsUpdatedMock is MergedPriceFeedAdapterWithoutRoundsMock {
  function version() public virtual pure override returns (uint256) {
    return 42;
  }
}
