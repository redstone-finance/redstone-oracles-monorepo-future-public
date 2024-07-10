// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library NumericArrayLib {
  // This function sort array in memory using bubble sort algorithm,
  // which performs even better than quick sort for small arrays

  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant UINT256_VALUE_BS = 32;

  error CanNotPickMedianOfEmptyArray();

  // This function modifies the array
  function pickMedian(uint256[] memory arr) internal pure returns (uint256) {
    if (arr.length == 2) {
      return (arr[0] + arr[1]) / 2;
    }
    if (arr.length == 0) {
      revert CanNotPickMedianOfEmptyArray();
    }
    sort(arr);
    uint256 middleIndex = arr.length / 2;
    if (arr.length % 2 == 0) {
      uint256 sum = arr[middleIndex - 1] + arr[middleIndex];
      return sum / 2;
    } else {
      return arr[middleIndex];
    }
  }

  function sort(uint256[] memory arr) internal pure {
    assembly {
      let arrLength := mload(arr)
      let valuesPtr := add(arr, BYTES_ARR_LEN_VAR_BS)
      let endPtr := add(valuesPtr, mul(arrLength, UINT256_VALUE_BS))
      for {
        let arrIPtr := valuesPtr
      } lt(arrIPtr, endPtr) {
        arrIPtr := add(arrIPtr, UINT256_VALUE_BS) // arrIPtr += 32
      } {
        for {
          let arrJPtr := valuesPtr
        } lt(arrJPtr, arrIPtr) {
          arrJPtr := add(arrJPtr, UINT256_VALUE_BS) // arrJPtr += 32
        } {
          let arrI := mload(arrIPtr)
          let arrJ := mload(arrJPtr)
          if lt(arrI, arrJ) {
            mstore(arrIPtr, arrJ)
            mstore(arrJPtr, arrI)
          }
        }
      }
    }
  }
}
