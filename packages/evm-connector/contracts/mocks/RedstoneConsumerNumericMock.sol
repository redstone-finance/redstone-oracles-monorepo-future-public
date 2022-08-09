// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerNumericMock is RedstoneConsumerNumericBase, AuthorisedMockSignersBase {
  constructor() {
    uniqueSignersThreshold = 10;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return getAuthorisedMockSignerIndex(_signerAddress);
  }

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    override
    returns (bool)
  {
    return _receivedTimestamp >= 1654353400000;
  }
}
