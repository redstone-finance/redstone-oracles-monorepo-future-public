// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {MergedPriceFeedAdapterWithRoundsMock} from "./MergedPriceFeedAdapterWithRoundsMock.sol";

contract MergedPriceFeedAdapterWithRoundsUpdatedMock is MergedPriceFeedAdapterWithRoundsMock {
  function version() public virtual pure override returns (uint256) {
    return 42;
  }
}
