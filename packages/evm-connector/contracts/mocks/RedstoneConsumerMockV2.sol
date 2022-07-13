// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// import "hardhat/console.sol";
import "../message-based/RedstoneConsumerBaseV2.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerMockV2 is RedstoneConsumerBaseV2, AuthorisedMockSignersBase {
  constructor() {
    uniqueSignersThreshold = 10;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return getAuthorisedMockSignerIndex(_signerAddress);
    // // console.log("Received signer", _signerAddress);

    // // Looks like an array but consumes less gas. TODO: check it
    // if (_signerAddress == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) {
    //   return 0;
    // } else if (_signerAddress == 0x70997970C51812dc3A010C7d01b50e0d17dc79C8) {
    //   return 1;
    // } else if (_signerAddress == 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) {
    //   return 2;
    // } else if (_signerAddress == 0x90F79bf6EB2c4f870365E785982E1f101E93b906) {
    //   return 3;
    // } else if (_signerAddress == 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65) {
    //   return 4;
    // } else if (_signerAddress == 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc) {
    //   return 5;
    // } else if (_signerAddress == 0x976EA74026E726554dB657fA54763abd0C3a0aa9) {
    //   return 6;
    // } else if (_signerAddress == 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955) {
    //   return 7;
    // } else if (_signerAddress == 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f) {
    //   return 8;
    // } else if (_signerAddress == 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720) {
    //   return 9;
    // } else {
    //   revert("Signer is not authorised");
    // }
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
