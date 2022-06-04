// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol"; // TODO: remove
import "../message-based/PriceAware.sol";

contract PriceAwareMock is PriceAware {
  function isSignerAuthorized(address _receviedSigner)
    public
    view
    virtual
    override
    returns (bool)
  {
    // TODO: remove
    console.log("Received signer", _receviedSigner);
    console.log("Expected signer", 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
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
