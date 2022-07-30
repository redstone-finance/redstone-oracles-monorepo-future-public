// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "./RedstoneConsumerBaseV2.sol";

abstract contract RedstoneConsumerBaseV3 is RedstoneConsumerBaseV2 {
  uint256 constant BITS_COUNT_IN_ONE_BYTE = 8;

  function _getDataPointValueByteSize(uint256 calldataOffset)
    internal
    pure
    override
    returns (uint256)
  {
    uint24 defaultDataPointValueByteSize;
    assembly {
      // Extracting the number of data points
      let negativeOffset := add(calldataOffset, add(SIG_BS, STANDARD_SLOT_BS))

      // Extracting the default data point value byte size
      defaultDataPointValueByteSize := calldataload(
        sub(sub(calldatasize(), negativeOffset), DATA_POINTS_COUNT_BS)
      )
    }
    return uint256(defaultDataPointValueByteSize);
  }

  function _extractDataPointValueAndSymbol(
    uint256 calldataOffset,
    uint256 defaultDataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure override returns (bytes32 dataPointSymbol, uint256 dataPointValue) {
    assembly {
      let negativeOffsetToDataPoints := add(
        calldataOffset,
        DATA_PACKAGE_WITHOUT_DATA_POINTS_BS
      )
      let dataPointCalldataOffset := sub(
        calldatasize(),
        add(
          negativeOffsetToDataPoints,
          mul(
            add(1, dataPointIndex),
            add(defaultDataPointValueByteSize, DATA_POINT_SYMBOL_BS)
          )
        )
      )
      dataPointSymbol := calldataload(dataPointCalldataOffset)
      dataPointValue := getNumberFromCalldata(
        add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS),
        defaultDataPointValueByteSize
      )

      function getNumberFromCalldata(numberCalldataOffset, byteSize) -> castedNumber {
        let numberStartOffset := sub(
          numberCalldataOffset,
          sub(STANDARD_SLOT_BS, byteSize)
        )
        castedNumber := and(
          sub(shl(mul(byteSize, BITS_COUNT_IN_ONE_BYTE), 1), 1),
          calldataload(numberStartOffset)
        )
      }
    }
  }
}
