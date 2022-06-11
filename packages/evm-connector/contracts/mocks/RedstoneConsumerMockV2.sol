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
    console.log("Received signer", _signerAddress);

    // Looks like an array but consumes less gas. TODO: check it
    if (_signerAddress == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) {
      return 0;
    } else if (_signerAddress == 0x70997970C51812dc3A010C7d01b50e0d17dc79C8) {
      return 1;
    } else if (_signerAddress == 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) {
      return 2;
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
