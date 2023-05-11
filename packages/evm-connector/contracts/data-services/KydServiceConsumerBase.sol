// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract KydServiceConsumerBase is RedstoneConsumerNumericBase {
  error ValuesArrayCanNotBeEmpty();
  error AllValuesMustBeEqual();

  function getDataServiceId() public view virtual override returns (string memory) {
    return "redstone-custom-urls-demo";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    if (signerAddress == 0x70997970C51812dc3A010C7d01b50e0d17dc79C8) {
      return 0;
    } else if (signerAddress == 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) {
      return 1;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }

  function aggregateValues(uint256[] memory values)
    public
    view
    virtual
    override
    returns (uint256)
  {
    if (values.length == 0) {
      revert ValuesArrayCanNotBeEmpty();
    }
    uint256 firstValue = values[0];
    for (uint256 index = 1; index < values.length; index++) {
      if (values[index] != firstValue) {
        revert AllValuesMustBeEqual();
      }
    }
    return firstValue;
  }
}
