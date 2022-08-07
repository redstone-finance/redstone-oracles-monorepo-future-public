// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library BitmapLib {
  uint256 constant EMPTY_BITMAP = 0;

  function setBitInBitmap(uint256 bitmap, uint256 bitIndex) internal pure returns (uint256) {
    return bitmap | (1 << bitIndex);
  }

  function getBitFromBitmap(uint256 bitmap, uint256 bitIndex) internal pure returns (bool) {
    uint256 bitAtIndex = bitmap & (1 << bitIndex);
    return bitAtIndex > 0;
  }
}
