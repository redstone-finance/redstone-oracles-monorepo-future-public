// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract RedstoneConstants {
  // === Abbreviations ===
  // BS - Bytes size
  // PTR - Pointer (memory location)
  // SIG - Signature

  uint256 constant DEFAULT_MAX_DATA_TIMESTAMP_DELAY_IN_SECONDS = 3 * 60;
  uint256 constant DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_IN_SECONDS = 60;

  // Solidity and YUL constants
  uint256 constant STANDARD_SLOT_BS = 32;
  uint256 constant FREE_MEMORY_PTR = 0x40;
  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant ECDSA_SIG_R_BS = 32;
  uint256 constant ECDSA_SIG_S_BS = 32;
  uint256 constant FUNCTION_SIGNATURE_BS = 4;

  // RedStone protocol consts
  uint256 constant SIG_BS = 65;
  uint256 constant TIMESTAMP_BS = 6;
  uint256 constant DATA_PACKAGES_COUNT_BS = 2;
  uint256 constant DATA_POINTS_COUNT_BS = 3;
  uint256 constant DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
  uint256 constant DATA_POINT_SYMBOL_BS = 32;
  uint256 constant DEFAULT_DATA_POINT_VALUE_BS = 32;

  // "Dynamic" values (based on consts)
  uint256 constant TIMESTAMP_NEGATIVE_OFFSET_IN_DATA_PACKAGE = 72; // SIG_BS + DATA_POINTS_COUNT_BS + DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS
  uint256 constant DATA_PACKAGE_WITHOUT_DATA_POINTS_BS = 78; // DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS + SIG_BS
  uint256 constant DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS = 13; // DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS
}
