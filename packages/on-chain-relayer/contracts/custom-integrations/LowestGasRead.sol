// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

abstract contract LowestGasRead {
    /**
   * @dev [HIGH RISK] Returns the latest value for a given data feed without validation
   * Important! Using this function instead of `getValueForDataFeed` may cause
   * significant risk for your smart contracts
   * @return dataFeedValue Unvalidated value of the latest successful update
   */
  function getBtcValueWithLowestGas() external view returns (uint256 dataFeedValue) {
    assembly {
      // THIS VALUE HAS TO BE PRE COMPUTED // precompute keccak256(abi.encode("BTC", 0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc))
      dataFeedValue := sload(0xf497211eccb68cc78a757a9caed87152a70e6da38b5f59e20a3feb628cda40b8) 
    }
  }
}
