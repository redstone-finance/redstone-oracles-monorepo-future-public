// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";

contract SampleWithEvents is RedstoneConsumerNumericMock {
  event ValueUpdated(uint256 _updatedValue);

  function emitEventWithLatestOracleValue() public {
    uint256 valueFromOracle = getOracleNumericValueFromTxMsg(bytes32("ETH"));
    emit ValueUpdated(valueFromOracle);
  }
}
