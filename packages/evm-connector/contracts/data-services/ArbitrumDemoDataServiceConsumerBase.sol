// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract ArbitrumDemoDataServiceConsumerBase is RedstoneConsumerNumericBase {
  function getDataServiceId() public view virtual override returns (string memory) {
    return "redstone-arbitrum-demo";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    if (signerAddress == 0x16883583647260AB2e2BA63c4c38D9807Fd7296e) {
      return 0;
    } else if (signerAddress == 0x1053d519Cc8C8cd7e53FecbFb13B6F0ffbD4c8C5) {
      return 1;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
