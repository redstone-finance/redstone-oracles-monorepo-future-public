// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "../message-based/RedstoneConsumerBaseV5.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerMockV5 is RedstoneConsumerBaseV5, AuthorisedMockSignersBase {
  constructor() {
    uniqueSignersThreshold = 3;
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
