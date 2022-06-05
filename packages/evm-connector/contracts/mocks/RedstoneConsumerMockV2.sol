// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "../message-based/RedstoneConsumerBaseV2.sol";

contract RedstoneConsumerMockV2 is RedstoneConsumerBaseV2 {
  constructor() {
    uniqueSignersTreshold = 2;
  }

  function isSignerAuthorized(address _receviedSigner) public view virtual override returns (bool) {
    // console.log("Received signer: ", _receviedSigner);
    // console.log(
    //   "Expected signer: ",
    //   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // );

    console.log("RedstoneConsumerMockV2 > uniqueSignersTreshold:", uniqueSignersTreshold);

    // Mock signer address
    return _receviedSigner == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  }

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    override
    returns (bool)
  {
    // console.log("Received timestamp", _receivedTimestamp);
    _receivedTimestamp;
    return true;
  }
}
