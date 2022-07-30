// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerBase.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerMock is RedstoneConsumerBase, AuthorisedMockSignersBase {
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
    return _receivedTimestamp > 0;
  }
}
