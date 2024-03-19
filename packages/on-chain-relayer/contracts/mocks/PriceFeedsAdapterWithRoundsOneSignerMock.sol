// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedsAdapterWithRoundsMock} from "./PriceFeedsAdapterWithRoundsMock.sol";

contract PriceFeedsAdapterWithRoundsOneSignerMock is PriceFeedsAdapterWithRoundsMock {
  function getDataFeedIds() public pure override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](3);
    dataFeedIds[0] = bytes32("BTC");
    dataFeedIds[1] = bytes32("ETH");
    dataFeedIds[2] = bytes32("AAVE");
  }

  function getMinIntervalBetweenUpdates() pure public override returns(uint256) {
    return 0;
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }
}
