// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract StocksDemoConsumerBase is RedstoneConsumerNumericBase {
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
    if (_signerAddress == 0x926E370fD53c23f8B71ad2B3217b227E41A92b12) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }
}
