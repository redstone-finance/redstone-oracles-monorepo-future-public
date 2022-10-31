// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../core/RedstoneConsumerNumericBase.sol";

contract KycServiceConsumerBase is RedstoneConsumerNumericBase {
  constructor() {
    uniqueSignersThreshold = 2;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    if (_signerAddress == 0x70997970C51812dc3A010C7d01b50e0d17dc79C8) {
      return 0;
    } else if (_signerAddress == 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) {
      return 1;
    } else {
      revert("Signer is not authorised");
    }
  }

  function aggregateValues(uint256[] memory values)
    public
    view
    virtual
    override
    returns (uint256)
  {
    require(values.length > 0, "Values array cannot be empty");
    uint256 firstValue = values[0];
    for (uint256 index = 1; index < values.length; index++) {
      require(values[index] == firstValue, "All values must be equal");
    }
    return firstValue;
  }
}
