// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract CustomUrlsConsumerBase is RedstoneConsumerNumericBase {
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
    if (signerAddress == 0x11fFFc9970c41B9bFB9Aa35Be838d39bce918CfF) {
      return 0;
    } else if (signerAddress == 0xdBcC2C6c892C8d3e3Fe4D325fEc810B7376A5Ed6) {
      return 1;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
