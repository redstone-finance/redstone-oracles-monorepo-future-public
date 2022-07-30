// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../message-based/RedstoneConsumerOldBase.sol";

contract SampleRedstoneConsumerOldStocks is RedstoneConsumerOldBase {
  function isSignerAuthorized(address _receviedSigner)
    public
    view
    virtual
    override
    returns (bool)
  {
    // Mock signer address
    return _receviedSigner == 0x926E370fD53c23f8B71ad2B3217b227E41A92b12;
  }

  function getTslaPriceSecurely() public view returns (uint256) {
    return getOracleValueFromTxMsg(bytes32("TSLA"));
  }
}
