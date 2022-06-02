// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAware.sol";

contract SampleWithEvents is PriceAware {

  event PriceUpdated(uint256 _ethPrice);

  function isSignerAuthorized(address _receviedSigner) public override virtual view returns (bool) {
    // For redstone-avalanche-prod price feed (it has 2 authorised signers)
    return _receviedSigner == 0x981bdA8276ae93F567922497153de7A5683708d3
      || _receviedSigner == 0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48
      || _receviedSigner == 0xc1D5b940659e57b7bDF8870CDfC43f41Ca699460
      || _receviedSigner == 0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a
      || _receviedSigner == 0xbC5a06815ee80dE7d20071703C1F1B8fC511c7d4
      || _receviedSigner == 0xe9Fa2869C5f6fC3A0933981825564FD90573A86D
      || _receviedSigner == 0xDf6b1cA313beE470D0142279791Fa760ABF5C537
      || _receviedSigner == 0xa50abc5D76dAb99d5fe59FD32f239Bd37d55025f
      || _receviedSigner == 0x496f4E8aC11076350A59b88D2ad62bc20d410EA3
      || _receviedSigner == 0x41FB6b8d0f586E73d575bC57CFD29142B3214A47
      || _receviedSigner == 0xC1068312a6333e6601f937c4773065B70D38A5bF
      || _receviedSigner == 0xAE9D49Ea64DF38B9fcbC238bc7004a1421f7eeE8;
  }

  function emitEventWithLatestEthPrice() public {
    uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
    emit PriceUpdated(ethPrice);
  }
}
