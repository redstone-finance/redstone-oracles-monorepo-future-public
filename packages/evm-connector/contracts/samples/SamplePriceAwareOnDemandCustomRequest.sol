// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAware.sol";

/**
 * @title SamplePriceAwareOnDemandCustomRequest
 * @dev Sample contract to test on demand custom requests
 */
contract SamplePriceAwareOnDemandCustomRequest is PriceAware {

  function isSignerAuthorized(address _receviedSigner) public override virtual view returns (bool) {
    return _receviedSigner == 0x63b3Cc527bFD6e060EB65d4e902667Ae19aEcEC2;
  }

  function getValue() public view returns(uint256) {
    return getPriceFromMsg(bytes32("0xd315c01cedca9a54"));
  }
}
