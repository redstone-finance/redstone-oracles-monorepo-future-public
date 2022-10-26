// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract MainDemoConsumerBase is RedstoneConsumerNumericBase {
  constructor() {
    uniqueSignersThreshold = 1;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    if (_signerAddress == 0x0C39486f770B26F5527BBBf942726537986Cd7eb) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }
}
