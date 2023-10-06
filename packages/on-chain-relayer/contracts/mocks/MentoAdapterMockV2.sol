// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import "./MentoAdapterMock.sol";

contract MentoAdapterMockV2 is MentoAdapterMock {
  function getDataFeedsCount() public pure override returns (uint256) {
    return 1;
  }
}
