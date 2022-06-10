// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "../message-based/RedstoneConsumerBaseV2.sol";

contract RedstoneConsumerMockV2 is RedstoneConsumerBaseV2 {
  constructor() {
    uniqueSignersTreshold = 1;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    if (_signerAddress == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    override
    returns (bool)
  {
    return _receivedTimestamp > 0;
  }
}
