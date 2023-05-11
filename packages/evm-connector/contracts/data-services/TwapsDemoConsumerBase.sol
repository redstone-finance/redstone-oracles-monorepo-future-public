// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract TwapsDemoConsumerBase is RedstoneConsumerNumericBase {
  function getDataServiceId() public view virtual override returns (string memory) {
    return "redstone-twaps-demo";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    if (signerAddress == 0xAAb9568f7165E66AcaFF50B705C3f3e964cbD24f) {
      return 0;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
