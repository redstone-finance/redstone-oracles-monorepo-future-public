// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract PrimaryDemoDataServiceConsumerBase is RedstoneConsumerNumericBase {
  function getDataServiceId() public view virtual override returns (string memory) {
    return "redstone-primary-demo";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    if (signerAddress == 0xdE13FdEE7a9B483129a81794d02FCB4021069f0C) {
      return 0;
    } else if (signerAddress == 0xad05Ce43E0bCD11345f08a28995951DEc30D5226) {
      return 1;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
