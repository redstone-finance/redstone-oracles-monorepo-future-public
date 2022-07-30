// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../mocks/RedstoneConsumerOldMock.sol";

contract ContractB is RedstoneConsumerOldMock {
  uint256 private lastValue = 0;

  function writeValue() public {
    uint256 tslaPrice = getOracleValueFromTxMsg(bytes32("TSLA"));
    lastValue = tslaPrice;
  }

  function getValue() public view returns (uint256) {
    uint256 result = getOracleValueFromTxMsg(bytes32("TSLA"));
    return result;
  }
}
