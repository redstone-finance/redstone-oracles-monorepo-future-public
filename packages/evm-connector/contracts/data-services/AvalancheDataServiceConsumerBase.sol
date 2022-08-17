// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract AvalancheDataServiceConsumerBase is RedstoneConsumerNumericBase {
  uint256 constant MAX_DATA_TIMESTAMP_DELAY_IN_SECONDS = 3 * 60;
  uint256 constant MAX_DATA_TIMESTAMP_AHEAD_IN_SECONDS = 60;

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
    if (_signerAddress == 0x981bdA8276ae93F567922497153de7A5683708d3) {
      return 0;
    } else if (_signerAddress == 0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48) {
      return 1;
    } else if (_signerAddress == 0xc1D5b940659e57b7bDF8870CDfC43f41Ca699460) {
      return 2;
    } else if (_signerAddress == 0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48) {
      return 3;
    } else if (_signerAddress == 0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a) {
      return 4;
    } else if (_signerAddress == 0xbC5a06815ee80dE7d20071703C1F1B8fC511c7d4) {
      return 5;
    } else if (_signerAddress == 0xe9Fa2869C5f6fC3A0933981825564FD90573A86D) {
      return 6;
    } else if (_signerAddress == 0xDf6b1cA313beE470D0142279791Fa760ABF5C537) {
      return 7;
    } else if (_signerAddress == 0xa50abc5D76dAb99d5fe59FD32f239Bd37d55025f) {
      return 8;
    } else if (_signerAddress == 0x496f4E8aC11076350A59b88D2ad62bc20d410EA3) {
      return 9;
    } else if (_signerAddress == 0x41FB6b8d0f586E73d575bC57CFD29142B3214A47) {
      return 10;
    } else if (_signerAddress == 0xC1068312a6333e6601f937c4773065B70D38A5bF) {
      return 11;
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
    require(
      (block.timestamp + MAX_DATA_TIMESTAMP_AHEAD_IN_SECONDS) > _receivedTimestamp,
      "Data with future timestamps is not allowed"
    );

    return
      block.timestamp < _receivedTimestamp ||
      block.timestamp - _receivedTimestamp < MAX_DATA_TIMESTAMP_DELAY_IN_SECONDS;
  }
}
