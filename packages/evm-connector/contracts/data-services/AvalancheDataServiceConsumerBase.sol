// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract AvalancheDataServiceConsumerBase is RedstoneConsumerNumericBase {
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 10;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    if (signerAddress == 0x981bdA8276ae93F567922497153de7A5683708d3) {
      return 0;
    } else if (signerAddress == 0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48) {
      return 1;
    } else if (signerAddress == 0xc1D5b940659e57b7bDF8870CDfC43f41Ca699460) {
      return 2;
    } else if (signerAddress == 0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a) {
      return 3;
    } else if (signerAddress == 0xbC5a06815ee80dE7d20071703C1F1B8fC511c7d4) {
      return 4;
    } else if (signerAddress == 0xe9Fa2869C5f6fC3A0933981825564FD90573A86D) {
      return 5;
    } else if (signerAddress == 0xDf6b1cA313beE470D0142279791Fa760ABF5C537) {
      return 6;
    } else if (signerAddress == 0xa50abc5D76dAb99d5fe59FD32f239Bd37d55025f) {
      return 7;
    } else if (signerAddress == 0x496f4E8aC11076350A59b88D2ad62bc20d410EA3) {
      return 8;
    } else if (signerAddress == 0x41FB6b8d0f586E73d575bC57CFD29142B3214A47) {
      return 9;
    } else if (signerAddress == 0xC1068312a6333e6601f937c4773065B70D38A5bF) {
      return 10;
    } else if (signerAddress == 0xAE9D49Ea64DF38B9fcbC238bc7004a1421f7eeE8) {
      return 11;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
