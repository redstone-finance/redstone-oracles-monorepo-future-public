// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract Counter {
  event Inc(uint256 count);
  uint256 count;

  constructor() {
    count = 0;
  }

  function inc() external {
    count += 1;
    emit Inc(count);
  }

  function fail() external pure {
    revert("This functions always reverts.");
  }

  function getCount() public view returns (uint256) {
    return count;
  }

  function getCountPlusOne() public view returns (uint256) {
    return count + 1;
  }

  function infiniteLoop() public view returns (uint256) {
    uint256 counter = 0;
    uint256 x;
    for(uint256 i =0; i < 100_000; i++) {
      assembly {
        x := sload(counter)
      }
      counter = counter + x;
    }

    return counter;
  }

  function getCountWithCallData32Bytes(uint256 param) public view returns (uint256) {
    return param;
  }
}
