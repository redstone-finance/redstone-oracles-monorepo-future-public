// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract AvalancheDemoConsumerBase is RedstoneConsumerNumericBase {
  function getDataServiceId() public view virtual override returns (string memory) {
    return "redstone-avalanche-demo";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    if (signerAddress == 0x3a7d971De367FE15D164CDD952F64205F2D9f10c) {
      return 0;
    } else if (signerAddress == 0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75) {
      return 1;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
