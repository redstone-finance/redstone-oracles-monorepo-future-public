// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAware.sol";

contract SamplePriceAwareWithMockData is PriceAware {
  function isSignerAuthorized(address _receviedSigner)
    public
    view
    virtual
    override
    returns (bool)
  {
    // Mock signer address
    return _receviedSigner == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  }

  function getEthPriceSecurely() public view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }
}
