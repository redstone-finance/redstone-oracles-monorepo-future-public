// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../libs/BitmapLib.sol";

contract SampleBitmapLib {
  function setBitInBitmap(uint256 bitmap, uint256 bitIndex) external pure returns (uint256) {
    return BitmapLib.setBitInBitmap(bitmap, bitIndex);
  }

  function getBitFromBitmap(uint256 bitmap, uint256 bitIndex) external pure returns (bool) {
    return BitmapLib.getBitFromBitmap(bitmap, bitIndex);
  }
}
