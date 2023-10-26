// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {IFluidOracle} from "./IFluidOracle.sol";
import {PriceFeedsAdapterWithoutRounds} from "../../price-feeds/without-rounds/PriceFeedsAdapterWithoutRounds.sol";

abstract contract EthUsdcRedstoneAdapterForFluidOracle is
  IFluidOracle,
  PriceFeedsAdapterWithoutRounds
{
  // precompute keccak256(abi.encode("ETH/USDC", 0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc))
  bytes32 constant PRICE_LOCATION_IN_STORAGE =
    0x02967e833d2ce9c403dca2db59409302fd3c621b131bafcc7adc11d77518462c;

  bytes32 constant private ETH_USDC_ID = bytes32("ETH/USDC");

  error UpdaterNotAuthorised(address signer);

  function getDataFeedIds() public pure override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = ETH_USDC_ID;
  }

  function getDataFeedIndex(bytes32 dataFeedId) public view override virtual returns (uint256) {
    if (dataFeedId == ETH_USDC_ID) { return 0; }
    revert DataFeedIdNotFound(dataFeedId);
  }

  function getExchangeRate()
    external
    view
    override
    returns (uint256 exchangeRate_)
  {
    assembly {
      exchangeRate_ := sload(PRICE_LOCATION_IN_STORAGE)
    }
  }

}