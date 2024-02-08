// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedWithRoundsMock} from "./PriceFeedWithRoundsMock.sol";

contract PriceFeedWithRoundsEthMock is PriceFeedWithRoundsMock {
  function getDataFeedId() public view virtual override returns (bytes32) {
    return bytes32("ETH");
  }
}
