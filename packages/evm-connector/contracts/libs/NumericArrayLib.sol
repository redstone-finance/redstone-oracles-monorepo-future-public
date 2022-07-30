// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// TODO: Implement linear-time median finding: https://rcoh.me/posts/linear-time-median-finding/
// TODO: Implement a function for average value calculation

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library NumericArrayLib {
  // This function sort array in memory using bubble sort algorithm,
  // which performs even better than quick sort for small arrays

  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant UINT256_VALUE_BS = 32;

  // This functions modifies the array
  function pickMedian(uint256[] memory arr) internal pure returns (uint256) {
    require(arr.length > 0, "Can't pick a median of an empty array");
    sort(arr);
    uint256 middleIndex = arr.length / 2;
    if (arr.length % 2 == 0) {
      uint256 sum = SafeMath.add(arr[middleIndex - 1], arr[middleIndex]);
      return sum / 2;
    } else {
      return arr[middleIndex];
    }
  }

  function sort(uint256[] memory arr) internal pure {
    // solidityBubbleSort(arr);
    assemblyBubbleSort(arr);
    // solidityQuickSortWithLastElemSelection(arr, 0, arr.length - 1);
  }

  function solidityQuickSortWithLastElemSelection(
    uint256[] memory arr,
    uint256 low,
    uint256 high
  ) internal pure {
    if (low < high) {
      // Partitioning
      uint256 pivot = arr[high]; // Maybe change to random element selection
      int256 i = int256(low) - 1;

      for (uint256 j = low; j < high; j++) {
        if (arr[j] < pivot) {
          i++;
          (arr[uint256(i)], arr[j]) = (arr[j], arr[uint256(i)]);
        }
      }
      uint256 pi = uint256(i + 1); // pi = partition index
      (arr[pi], arr[high]) = (arr[high], arr[pi]);

      // Calling sort on both sub arrays
      solidityQuickSortWithLastElemSelection(arr, low, pi - 1);
      solidityQuickSortWithLastElemSelection(arr, pi + 1, high);
    }
  }

  // assemblyBubbleSort is 2K gas cheaper than solidityBubbleSort
  // for an array with 5 elements
  function assemblyBubbleSort(uint256[] memory arr) internal pure {
    assembly {
      let arrLength := mload(arr)
      let valuesPtr := add(arr, BYTES_ARR_LEN_VAR_BS)
      for {
        let i := 0
      } lt(i, arrLength) {
        i := add(i, 1) // i++
      } {
        for {
          let j := 0
        } lt(j, i) {
          j := add(j, 1) // j++
        } {
          let arrIPtr := add(valuesPtr, mul(i, UINT256_VALUE_BS))
          let arrJPtr := add(valuesPtr, mul(j, UINT256_VALUE_BS))
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

  function solidityBubbleSort(uint256[] memory arr) internal pure {
    for (uint256 i = 0; i < arr.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        if (arr[i] < arr[j]) {
          (arr[i], arr[j]) = (arr[j], arr[i]);
        }
      }
    }
  }
}
