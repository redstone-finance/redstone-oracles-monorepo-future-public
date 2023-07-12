// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "redstone-on-chain-relayer/contracts/price-feeds/without-rounds/PriceFeedsAdapterWithoutRounds.sol";

contract EthMainDemoPriceFeedsAdapter is PriceFeedsAdapterWithoutRounds {
  function getDataFeedIds() public pure override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = bytes32("ETH");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(address signerAddress)
  public
  view
  virtual
  override
  returns (uint8)
  {
    if (signerAddress == 0x0C39486f770B26F5527BBBf942726537986Cd7eb) {
      return 0;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
