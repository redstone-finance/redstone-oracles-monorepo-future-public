// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SinglePriceFeedAdapter} from "../without-rounds/SinglePriceFeedAdapter.sol";

contract VSTPriceFeedsAdapterWithoutRoundsMainDemo is SinglePriceFeedAdapter {
  function getDataFeedId() public pure override returns (bytes32) {
    return bytes32("VST");
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
    if (signerAddress == 0x0C39486f770B26F5527BBBf942726537986Cd7eb) {
      return 0;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
