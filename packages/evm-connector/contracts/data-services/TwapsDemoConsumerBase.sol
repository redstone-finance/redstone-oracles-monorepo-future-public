// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract TwapsDemoConsumerBase is RedstoneConsumerNumericBase {
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
    if (_signerAddress == 0xAAb9568f7165E66AcaFF50B705C3f3e964cbD24f) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }
}
