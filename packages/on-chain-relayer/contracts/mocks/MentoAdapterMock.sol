// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {AuthorisedMockSignersBase} from "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import {MentoAdapterBase} from "../custom-integrations/mento/MentoAdapterBase.sol";
import {ISortedOracles} from "../custom-integrations/mento/ISortedOracles.sol";

contract MentoAdapterMock is MentoAdapterBase, AuthorisedMockSignersBase {
  bytes32 constant SORTED_ORACLES_STORAGE_LOCATION =
    0xffb5022e7ec148ee9291f1db3ace462efbd625c0fdffbcd0ab6d6554364a3bfd; // keccak256("RedStone.sortedOracles");

  function setSortedOraclesAddress(ISortedOracles sortedOracles) public {
    assembly {
      sstore(SORTED_ORACLES_STORAGE_LOCATION, sortedOracles)
    }
  }

  function getSortedOracles()
    public
    view
    override
    returns (ISortedOracles sortedOracles)
  {
    assembly {
      sortedOracles := sload(SORTED_ORACLES_STORAGE_LOCATION)
    }
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedMockSignerIndex(signerAddress);
  }

  function getTokenDetailsAtIndex(
    uint256 tokenIndex
  ) public view virtual override returns (bytes32 dataFeedId, address tokenAddress) {
    if (tokenIndex == 0) {
      return (bytes32("BTC"), 0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9);
    } else if (tokenIndex == 1) {
      return (bytes32("ETH"), 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1);
    } else {
      revert TokenNotFoundForIndex(tokenIndex);
    }
  }

  function getDataFeedsCount() public pure virtual override returns (uint256) {
    return 2;
  }
}
