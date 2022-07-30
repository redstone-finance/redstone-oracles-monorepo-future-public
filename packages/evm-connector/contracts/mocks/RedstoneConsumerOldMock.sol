// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerOldBase.sol";

contract RedstoneConsumerOldMock is RedstoneConsumerOldBase {
  function isSignerAuthorized(address _receviedSigner)
    public
    view
    virtual
    override
    returns (bool)
  {
    // Mock signer address
    return _receviedSigner == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  }

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    override
    returns (bool)
  {
    _receivedTimestamp;
    return true;
  }
}
