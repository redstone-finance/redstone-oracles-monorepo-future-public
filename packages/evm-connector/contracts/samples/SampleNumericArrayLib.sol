// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../libs/NumericArrayLib.sol";

contract SampleNumericArrayLib {
  uint256[] cachedArray;
  uint256 public cachedMedian;

  // function testSortCall(uint256[] memory arr) public view returns (uint256[] memory) {
  //   NumericArrayLib.sort(arr);
  //   return arr;
  // }

  function testSortTx(uint256[] memory arr) public {
    NumericArrayLib.sort(arr);
    cachedArray = arr;
  }

  // Can be used to compare gas costs with the `testSortTx` function
  function testArrayUpdatingInStorage(uint256[] memory arr) public {
    cachedArray = arr;
  }

  function getCachedArray() public view returns (uint256[] memory) {
    return cachedArray;
  }

  function testMedianSelection(uint256[] memory arr) public {
    cachedMedian = NumericArrayLib.pickMedian(arr);
  }
}
