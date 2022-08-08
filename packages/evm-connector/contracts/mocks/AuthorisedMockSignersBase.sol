// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract AuthorisedMockSignersBase {
  function getAuthorisedMockSignerIndex(address _signerAddress)
    public
    view
    virtual
    returns (uint256)
  {
    return getAllMockExceptLastOneAuthorised(_signerAddress);
  }

  function getAllMockExceptLastOneAuthorised(address _signerAddress)
    public
    view
    virtual
    returns (uint256)
  {
    if (_signerAddress == 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199) {
      revert("Signer is not authorised");
    } else {
      return getAllMockAuthorised(_signerAddress);
    }
  }

  function getAllMockAuthorised(address _signerAddress) public view virtual returns (uint256) {
    // Looks like an array but consumes less gas
    if (_signerAddress == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) {
      return 0;
    } else if (_signerAddress == 0x70997970C51812dc3A010C7d01b50e0d17dc79C8) {
      return 1;
    } else if (_signerAddress == 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) {
      return 2;
    } else if (_signerAddress == 0x90F79bf6EB2c4f870365E785982E1f101E93b906) {
      return 3;
    } else if (_signerAddress == 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65) {
      return 4;
    } else if (_signerAddress == 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc) {
      return 5;
    } else if (_signerAddress == 0x976EA74026E726554dB657fA54763abd0C3a0aa9) {
      return 6;
    } else if (_signerAddress == 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955) {
      return 7;
    } else if (_signerAddress == 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f) {
      return 8;
    } else if (_signerAddress == 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720) {
      return 9;
    } else if (_signerAddress == 0xBcd4042DE499D14e55001CcbB24a551F3b954096) {
      return 10;
    } else if (_signerAddress == 0x71bE63f3384f5fb98995898A86B02Fb2426c5788) {
      return 11;
    } else if (_signerAddress == 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a) {
      return 12;
    } else if (_signerAddress == 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec) {
      return 13;
    } else if (_signerAddress == 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097) {
      return 14;
    } else if (_signerAddress == 0xcd3B766CCDd6AE721141F452C550Ca635964ce71) {
      return 15;
    } else if (_signerAddress == 0x2546BcD3c84621e976D8185a91A922aE77ECEc30) {
      return 16;
    } else if (_signerAddress == 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E) {
      return 17;
    } else if (_signerAddress == 0xdD2FD4581271e230360230F9337D5c0430Bf44C0) {
      return 18;
    } else if (_signerAddress == 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199) {
      return 19;
    } else {
      revert("Signer is not authorised");
    }
  }
}
