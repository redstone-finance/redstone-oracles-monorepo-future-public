// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV2.sol";

contract SampleRedstoneConsumerMockManySymbolsV2 is RedstoneConsumerMockV2 {
  uint256 public latestEthPrice;
  uint256 public latestBtcPrice;

  function saveLatestPricesInStorage() public {
    // Get oracle values
    bytes32[] memory symbols = new bytes32[](2);
    symbols[0] = bytes32("ETH");
    symbols[1] = bytes32("BTC");
    uint256[] memory values = getOracleValuesFromTxMsg(symbols);

    // Save values in contract state
    latestEthPrice = values[0];
    latestBtcPrice = values[1];
  }
}
