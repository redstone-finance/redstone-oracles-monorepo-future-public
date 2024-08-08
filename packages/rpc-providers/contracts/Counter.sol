// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract Counter {
  event Inc(uint256 count);
  uint256 count;
  address multicallAddress;

  mapping(uint256 => uint256) gasBurnerMap;

  constructor(address _multicallAddress) {
    multicallAddress = _multicallAddress;
    count = 0;
  }

  function inc() external {
    count += 1;
    emit Inc(count);
  }

  function incBy(uint256 by) external {
    count += by;
    emit Inc(count);
  }

  function fail() external pure {
    revert("This functions always reverts.");
  }

  function returnCountIfNotMulticall() external view returns (uint256) {
    if (msg.sender == multicallAddress) {
      revert("This functions always reverts.");
    }

    return count;
  }

  function getCount() public view returns (uint256) {
    return count;
  }

  function getCountPlusOne() public view returns (uint256) {
    return count + 1;
  }

  function infiniteLoop() public view returns (uint256) {
    // counter will always equal 0
    uint256 counter = 0;
    // shoud consume > 200k gas
    for (uint256 i = 0; i < 100; i++) {
      counter += gasBurnerMap[i];
    }

    return count + counter;
  }

  function getCountWithCallData32Bytes(
    uint256 param
  ) public pure returns (uint256) {
    return param;
  }
}
