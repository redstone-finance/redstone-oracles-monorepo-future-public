// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.17;

import "../core/RedstoneConsumerNumericBase.sol";

contract StagingDemoDataServiceConsumerBase is RedstoneConsumerNumericBase {
  function getDataServiceId()
    public
    view
    virtual
    override
    returns (string memory)
  {
    return "redstone-external-demo-1";
  }

  function getUniqueSignersThreshold()
    public
    view
    virtual
    override
    returns (uint8)
  {
    return 1;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    if (signerAddress == 0x8e959CBA422cC14AAE2b1d36970293E955a05fA8) {
      // Ext 1
      return 0;
    } else if (signerAddress == 0x1f9D87e3aE042B2A3311D72eC6f44A89B24CEed8) {
      // Ext 2
      return 1;
    } else if (signerAddress == 0x4564a9FdB414c320C74C908f60c204e486eC1e2a) {
      // Bware
      return 2;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
